"""
ApplyAI Retriever

Responsibilities:
- Convert job description into embedding
- Search user's Pinecone namespace
- Return relevant resume chunks
"""

import logging

from fastapi import HTTPException

from core.voyage import (
    voyage_client,
    VOYAGE_MODEL
)

from core.pinecone import pinecone_index




logger = logging.getLogger(__name__)

def embed_query(
    text: str
):
    """
    Create embedding for job description.
    """

    try:

        response = voyage_client.embed(
            [text],
            model=VOYAGE_MODEL
        )

        return response.embeddings[0]


    except Exception as error:

        raise Exception(
            f"Job embedding failed: {error}"
        )



def format_chunk(
    item
):
    """
    Convert Pinecone result into application format.
    """

    metadata = item.metadata


    return {

        "resume_type":
        metadata.get(
            "resume_type",
            ""
        ),

        "source_file":
        metadata.get(
            "source_file",
            ""
        ),

        "chunk_text":
        metadata.get(
            "chunk_text",
            ""
        ),

        "score":
        item.score
    }



def search_chunks(
    job_description: str,
    user_id: str
):
    """
    Search matching resume chunks
    from user's namespace.
    """

    try:

        query_vector = embed_query(
            job_description
        )


        result = pinecone_index.query(

            vector=query_vector,

            # Chunks are now ~200 words instead of 800, so a resume produces
            # roughly 4x more of them. Pull proportionally more candidates.
            top_k=30,

            include_metadata=True,

            namespace=user_id
        )
        if not result.matches:
            return []


        chunks = []


        for item in result.matches:

            if item.score >= 0.45:

                chunks.append(
                    format_chunk(item)
                )


        # fallback if no strong matches
        if len(chunks) < 5:


            chunks = []


            for item in result.matches:

                if item.score >= 0.30:

                    chunks.append(
                        format_chunk(item)
                    )


        return chunks



    except Exception as error:  # noqa: F841

        logger.exception("Chunk retrieval failed")

        raise HTTPException(

            status_code=500,

            detail="Retrieval failed."

        ) from error