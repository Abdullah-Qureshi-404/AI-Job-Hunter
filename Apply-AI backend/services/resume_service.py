"""
=========================================================
ApplyAI Resume Service
=========================================================

Business logic for the Resume module.

Responsibilities:
- Validate uploaded resume
- Upload PDF to Supabase Storage
- Save resume metadata
- Fetch user resumes
- Delete user resume

The embedding pipeline will be connected later.
"""

import logging
import os
import re
import uuid

from fastapi import HTTPException, UploadFile

from core.supabase import supabase
from rag.embedder import delete_resume_vectors, embed_resume, extract_text


logger = logging.getLogger(__name__)


BUCKET_NAME = "resumes"

MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB

_SAFE_FILENAME = re.compile(r"[^A-Za-z0-9._-]+")


def safe_filename(filename: str) -> str:
    """
    Strip any directory component and unusual characters from a client-supplied
    filename before it becomes part of a storage path.
    """

    base = os.path.basename(filename.replace("\\", "/"))
    cleaned = _SAFE_FILENAME.sub("_", base).lstrip(".")

    return cleaned or "resume.pdf"


def upload_resume(
    user_id: str,
    file: UploadFile,
    resume_type: str,
):
    """
    Upload a user's resume.
    """

    try:

        # -----------------------------
        # Validate filename
        # -----------------------------
        if not file.filename:
            raise HTTPException(
                status_code=400,
                detail="No file selected."
            )

        # -----------------------------
        # Validate PDF
        # -----------------------------
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=400,
                detail="Only PDF files are allowed."
            )

        # -----------------------------
        # Read file
        # -----------------------------
        file_bytes = file.file.read(MAX_UPLOAD_BYTES + 1)

        if len(file_bytes) == 0:
            raise HTTPException(
                status_code=400,
                detail="Uploaded file is empty."
            )

        if len(file_bytes) > MAX_UPLOAD_BYTES:
            raise HTTPException(
                status_code=413,
                detail="Resume exceeds the 10 MB limit."
            )

        # -----------------------------
        # Extract raw resume text
        # -----------------------------
        # A scanned/image-only PDF yields no text. That is not fatal, but it
        # must be reported: an empty extraction silently produces an empty
        # /profile/ response later.
        extracted_text = ""
        extraction_warning = None
        try:
            extracted_text = extract_text(file_bytes)
        except Exception as error:
            logger.warning("Text extraction failed for %s: %s", file.filename, error)
            extraction_warning = (
                "No text could be read from this PDF. If it is a scan, "
                "upload a text-based version so skills can be extracted."
            )

        # -----------------------------
        # Generate unique filename
        # -----------------------------
        unique_name = (
            f"{uuid.uuid4()}_{safe_filename(file.filename)}"
        )

        storage_path = (
            f"{user_id}/{unique_name}"
        )

        # -----------------------------
        # Upload to Supabase Storage
        # -----------------------------
        upload_response = (
            supabase.storage
            .from_(BUCKET_NAME)
            .upload(
                path=storage_path,
                file=file_bytes,
                file_options={
                    "content-type": "application/pdf"
                }
            )
        )

        if upload_response is None:
            raise HTTPException(
                status_code=500,
                detail="Failed to upload resume."
            )

        # -----------------------------
        # Save metadata
        # -----------------------------
        # The `extracted_text` column is part of the schema (see schema.sql).
        # This used to retry the insert without it on any failure, which
        # silently reinterpreted constraint and auth errors as schema drift.
        response = (
            supabase.table("resumes")
            .insert(
                {
                    "user_id": user_id,
                    "file_name": unique_name,
                    "resume_type": resume_type,
                    "storage_path": storage_path,
                    "is_embedded": False,
                    "extracted_text": extracted_text,
                }
            )
            .execute()
        )

        if not response.data:
            _remove_storage_object(storage_path)
            raise HTTPException(
                status_code=500,
                detail="Failed to save resume."
            )

        resume = response.data[0]

        # ------------------------------------
        # Embedding
        # ------------------------------------
        # On failure, undo the storage upload and the metadata row. Leaving
        # them behind meant every retry added another orphaned copy, and those
        # copies then all fed the profile prompt.
        try:
            embedding_result = embed_resume(
                source_file=unique_name,
                user_id=user_id,
                storage_path=storage_path,
                resume_type=resume_type,
                resume_id=resume["id"],
            )
        except Exception:
            logger.exception("Embedding failed - rolling back upload %s", storage_path)
            _remove_storage_object(storage_path)
            _remove_resume_row(resume["id"])
            raise HTTPException(
                status_code=502,
                detail=(
                    "Resume could not be indexed and was not saved. "
                    "Please try again."
                ),
            )

        result = {
            "resume_id": resume["id"],
            "file_name": unique_name,
            "resume_type": resume_type,
            "status": "uploaded_and_embedded",
            "embedding": embedding_result,
        }

        if extraction_warning:
            result["warning"] = extraction_warning

        return result

    except HTTPException:
        raise

    except Exception as error:

        logger.exception("Resume upload failed")

        raise HTTPException(
            status_code=500,
            detail="Resume upload failed."
        ) from error


def _remove_storage_object(storage_path: str):
    """Best-effort cleanup; never masks the original error."""

    try:
        supabase.storage.from_(BUCKET_NAME).remove([storage_path])
    except Exception:
        logger.exception("Failed to clean up storage object %s", storage_path)


def _remove_resume_row(resume_id: str):
    """Best-effort cleanup; never masks the original error."""

    try:
        supabase.table("resumes").delete().eq("id", resume_id).execute()
    except Exception:
        logger.exception("Failed to clean up resume row %s", resume_id)


def get_user_resumes(
    user_id: str,
    limit: int = 50,
    offset: int = 0,
):
    """
    Return a page of the user's resumes, newest first.
    """

    try:

        response = (
            supabase.table("resumes")
            .select("*")
            .eq("user_id", user_id)
            .order(
                "uploaded_at",
                desc=True
            )
            .range(offset, offset + limit - 1)
            .execute()
        )

        resumes = []

        for resume in response.data:

            resumes.append(
                {
                    "resume_id": resume["id"],
                    "file_name": resume["file_name"],
                    "resume_type": resume["resume_type"],
                    "uploaded_at": resume["uploaded_at"],
                    "is_embedded": resume["is_embedded"],
                }
            )

        return resumes

    except Exception as error:

        logger.exception("Failed to fetch resumes for %s", user_id)

        raise HTTPException(
            status_code=500,
            detail="Failed to fetch resumes."
        ) from error


def delete_resume(
    user_id: str,
    resume_id: str,
):
    """
    Delete a user's resume.
    """

    try:

        response = (
            supabase.table("resumes")
            .select("*")
            .eq("id", resume_id)
            .eq("user_id", user_id)
            .execute()
        )

        if not response.data:

            raise HTTPException(
                status_code=404,
                detail="Resume not found."
            )

        resume = response.data[0]

        # -----------------------------
        # Delete vectors first
        # -----------------------------
        # Order matters: if this is left until last and the process dies, the
        # chunks stay searchable forever with no row left to identify them.
        vectors_removed = delete_resume_vectors(
            user_id=user_id,
            source_file=resume["file_name"],
        )

        # -----------------------------
        # Delete from Storage
        # -----------------------------
        supabase.storage.from_(
            BUCKET_NAME
        ).remove(
            [
                resume["storage_path"]
            ]
        )

        # -----------------------------
        # Delete from Database
        # -----------------------------
        supabase.table(
            "resumes"
        ).delete().eq(
            "id",
            resume_id
        ).execute()

        result = {
            "message": "Resume deleted successfully"
        }

        if not vectors_removed:
            result["warning"] = (
                "Resume deleted, but its search index entries could not be "
                "removed and may still influence generated content."
            )

        return result

    except HTTPException:
        raise

    except Exception as error:

        logger.exception("Resume delete failed for %s", resume_id)

        raise HTTPException(
            status_code=500,
            detail="Delete failed."
        ) from error