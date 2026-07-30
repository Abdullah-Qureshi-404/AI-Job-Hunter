"""
ApplyAI Groq Client

Creates reusable Groq LLM client.

Used for:
- Resume generation
- Job description analysis
- Email generation
"""

from groq import Groq

from core.config import settings


def create_groq_client():
    """
    Creates and returns Groq client.
    """

    try:

        client = Groq(
            api_key=settings.GROQ_API_KEY
        )

        return client

    except Exception as error:
        raise Exception(
            f"Groq initialization failed: {error}"
        )


# Global Groq client
groq_client = create_groq_client()


# Model used throughout ApplyAI
GROQ_MODEL = "llama-3.3-70b-versatile"
GROQ_VISION_MODEL = "qwen/qwen3.6-27b"