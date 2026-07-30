"""
ApplyAI Voyage AI Client

Creates reusable Voyage AI client.

Used for:
- Resume text embeddings
- Job description embeddings
"""

import voyageai

from core.config import settings


def create_voyage_client():

    try:

        if not settings.VOYAGE_API_KEY:
            raise ValueError(
                "VOYAGE_API_KEY missing in .env"
            )

        client = voyageai.Client(
            api_key=settings.VOYAGE_API_KEY
        )

        return client


    except Exception as error:

        raise Exception(
            f"Voyage AI initialization failed: {error}"
        )


voyage_client = create_voyage_client()


VOYAGE_MODEL = "voyage-2"