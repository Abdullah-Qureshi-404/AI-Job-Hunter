"""
ApplyAI Supabase Client

Creates one reusable Supabase client.

Used for:
- Authentication
- Database operations
- Storage uploads/downloads
"""

from supabase import create_client, Client
from core.config import settings


def create_supabase_client() -> Client:
    """
    Creates and returns Supabase client.
    """

    try:
        client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_KEY
        )

        return client

    except Exception as error:
        raise Exception(
            f"Supabase client initialization failed: {error}"
        )


# Global Supabase client
supabase = create_supabase_client()