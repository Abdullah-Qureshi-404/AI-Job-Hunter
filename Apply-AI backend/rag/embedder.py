"""

ApplyAI Resume Embedder



Flow:



PDF

 ↓

Extract Text

 ↓

Create Chunks

 ↓

Voyage Embeddings

 ↓

Pinecone Storage

 ↓

Update Database

"""



import io

import logging

import re

import uuid



from pypdf import PdfReader

from fastapi import HTTPException





from core.supabase import supabase

from core.voyage import (

    voyage_client,

    VOYAGE_MODEL

)



from core.pinecone import pinecone_index
from rag.text_repair import repair_spacing





logger = logging.getLogger(__name__)





BUCKET_NAME = "resumes"





# Words per chunk. 800 was far too coarse: an entire resume fitted in one or

# two chunks, so vector search could not distinguish "skills" from "education"

# and retrieval returned near-duplicates of the whole document.

CHUNK_SIZE = 200



# Words repeated between neighbouring chunks so a sentence spanning a boundary

# is still retrievable from either side.

CHUNK_OVERLAP = 40





def download_pdf(storage_path: str):

    """

    Download PDF from Supabase storage.

    """



    try:



        file_bytes = (

            supabase.storage

            .from_(BUCKET_NAME)

            .download(storage_path)

        )



        return file_bytes





    except Exception as error:



        raise Exception(

            f"PDF download failed: {error}"

        )







def extract_text(pdf_bytes: bytes):

    """

    Extract text from PDF.

    """



    try:



        pdf_file = io.BytesIO(pdf_bytes)



        reader = PdfReader(pdf_file)





        text = ""





        for page in reader.pages:



            page_text = (

                page.extract_text()

                or ""

            )



            text += page_text + "\n"





        if not text.strip():



            raise Exception(

                "No text found in PDF"

            )





        return repair_spacing(text.strip())





    except Exception as error:



        raise Exception(

            f"PDF extraction failed: {error}"

        )







def create_chunks(

    text: str

):

    """

    Split text into overlapping chunks for retrieval.



    Chunks overlap by CHUNK_OVERLAP words so a fact that straddles a boundary

    is still findable from either chunk.

    """



    words = text.split()



    if not words:

        return []



    step = max(1, CHUNK_SIZE - CHUNK_OVERLAP)



    chunks = []



    for start_index in range(0, len(words), step):

        window = words[start_index:start_index + CHUNK_SIZE]



        if not window:

            break



        chunks.append(" ".join(window))



        # Stop once the window reaches the end, otherwise the overlap would

        # emit repeated tail chunks.

        if start_index + CHUNK_SIZE >= len(words):

            break



    return chunks







def update_embedding_status(

    resume_id: str

):

    """

    Mark resume as embedded.

    """



    supabase.table(

        "resumes"

    ).update(

        {

            "is_embedded": True

        }

    ).eq(

        "id",

        resume_id

    ).execute()







def embed_resume(

    storage_path: str,

    user_id: str,

    resume_type: str,

    source_file: str,

    resume_id: str

):

    """

    Create and store resume embeddings.

    """



    try:





        logger.info(

            "Downloading resume..."

        )





        pdf_bytes = download_pdf(

            storage_path

        )





        logger.info(

            "Extracting text..."

        )





        text = extract_text(

            pdf_bytes

        )





        logger.info(

            "Creating chunks..."

        )





        chunks = create_chunks(

            text

        )





        if not chunks:



            raise Exception(

                "No chunks created"

            )





        logger.info(

            f"{len(chunks)} chunks created"

        )





        logger.info(

            "Generating embeddings..."

        )





        embedding_response = (

            voyage_client.embed(

                chunks,

                model=VOYAGE_MODEL

            )

        )





        embeddings = (

            embedding_response

            .embeddings

        )







        vectors = []





        for index, chunk in enumerate(chunks):





            vectors.append(

                {

                    "id":

                    f"{user_id}-{uuid.uuid4()}",





                    "values":

                    embeddings[index],





                    "metadata":

                    {

                        "user_id": user_id,



                        "resume_type":

                        resume_type,



                        "source_file":

                        source_file,



                        "chunk_text":

                        chunk

                    }

                }

            )







        logger.info(

            "Saving vectors..."

        )





        pinecone_index.upsert(

            vectors=vectors,

            namespace=user_id

        )





        update_embedding_status(

            resume_id

        )





        logger.info(

            "Embedding completed"

        )





        return {



            "chunks_embedded":

            len(vectors),



            "status":

            "completed"

        }







    except Exception as error:



        logger.exception("Embedding failed for resume %s", resume_id)



        raise HTTPException(

            status_code=500,

            detail="Embedding failed."

        ) from error





def delete_resume_vectors(

    user_id: str,

    source_file: str,

):

    """

    Remove a resume's chunks from the vector index.



    Without this, deleted resumes keep being retrieved by search_chunks and

    keep shaping generated resumes - a silent correctness bug the user cannot

    see or undo.

    """



    try:



        pinecone_index.delete(

            filter={"source_file": source_file},

            namespace=user_id,

        )



        return True



    except Exception:



        logger.exception(

            "Failed to delete vectors for %s in namespace %s",

            source_file,

            user_id,

        )



        return False