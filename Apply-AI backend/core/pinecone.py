"""
ApplyAI Pinecone Client

Creates Pinecone connection.

Used for:
- Resume embeddings storage
- User-specific vector search
"""

from pinecone import Pinecone

from core.config import settings


def create_pinecone_index():
    """
    Creates Pinecone index connection.
    """

    try:

        if not settings.PINECONE_API_KEY:
            raise ValueError(
                "PINECONE_API_KEY missing in .env"
            )

        pinecone_client = Pinecone(
            api_key=settings.PINECONE_API_KEY
        )

        index = pinecone_client.Index(
            settings.PINECONE_INDEX_NAME
        )

        return index

    except Exception as error:
        raise Exception(
            f"Pinecone initialization failed: {error}"
        )


# Global Pinecone index
pinecone_index = create_pinecone_index()