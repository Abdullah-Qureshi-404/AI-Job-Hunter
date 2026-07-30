"""
=========================================================
ApplyAI - Configuration
=========================================================

This file loads all environment variables from the .env
file and makes them available throughout the application.

Other modules should import settings from here instead
of reading environment variables directly.

Example:
from core.config import settings
"""

import os

from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()


class Settings:
    """Application configuration."""

    def __init__(self):
        # ---------------------------
        # Supabase
        # ---------------------------
        self.SUPABASE_URL = os.getenv("SUPABASE_URL")
        self.SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

        # ---------------------------
        # Pinecone
        # ---------------------------
        self.PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
        self.PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME")

        # ---------------------------
        # Voyage AI
        # ---------------------------
        self.VOYAGE_API_KEY = os.getenv("VOYAGE_API_KEY")

        # ---------------------------
        # Groq
        # ---------------------------
        self.GROQ_API_KEY = os.getenv("GROQ_API_KEY")

        # ---------------------------
        # Gmail OAuth
        # ---------------------------
        self.GMAIL_CLIENT_ID = os.getenv("GMAIL_CLIENT_ID")
        self.GMAIL_CLIENT_SECRET = os.getenv("GMAIL_CLIENT_SECRET")
        self.GMAIL_REDIRECT_URI = os.getenv("GMAIL_REDIRECT_URI")

    def validate(self):
        """
        Validate that all required environment variables exist.
        """

        required = {
            "SUPABASE_URL": self.SUPABASE_URL,
            "SUPABASE_SERVICE_KEY": self.SUPABASE_SERVICE_KEY,
            "PINECONE_API_KEY": self.PINECONE_API_KEY,
            "PINECONE_INDEX_NAME": self.PINECONE_INDEX_NAME,
            "VOYAGE_API_KEY": self.VOYAGE_API_KEY,
            "GROQ_API_KEY": self.GROQ_API_KEY,
        }

        missing = [key for key, value in required.items() if not value]

        if missing:
            raise ValueError(
                "Missing environment variables: "
                + ", ".join(missing)
            )


# Global settings object
settings = Settings()