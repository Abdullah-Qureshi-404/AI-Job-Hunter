import os
from django.conf import settings
from rest_framework import authentication
from rest_framework import exceptions
from supabase import create_client, Client


class SupabaseUser:
    """
    Lightweight user object representing an authenticated Supabase user.
    """

    def __init__(self, supabase_uid: str, email: str):
        self.id = supabase_uid
        self.supabase_uid = supabase_uid
        self.email = email
        self.is_authenticated = True

    def __str__(self):
        return f"SupabaseUser({self.email})"


class SupabaseAuthentication(authentication.BaseAuthentication):
    """
    Custom DRF Authentication class to validate Supabase JWT tokens.
    """

    def __init__(self):
        self.supabase: Client = None

    def _get_supabase_client(self) -> Client:
        if self.supabase is None:
            supabase_url = getattr(settings, "SUPABASE_URL", os.getenv("SUPABASE_URL"))
            supabase_key = getattr(settings, "SUPABASE_SERVICE_KEY", os.getenv("SUPABASE_SERVICE_KEY"))

            if not supabase_url or not supabase_key:
                raise exceptions.AuthenticationFailed("Supabase configuration missing")

            self.supabase = create_client(supabase_url, supabase_key)

        return self.supabase

    def authenticate(self, request):
        auth_header = request.META.get("HTTP_AUTHORIZATION")
        if not auth_header:
            return None

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            raise exceptions.AuthenticationFailed("Invalid authorization header format")

        token = parts[1]

        try:
            client = self._get_supabase_client()
            response = client.auth.get_user(token)

            if not response or not response.user:
                raise exceptions.AuthenticationFailed("Invalid authentication token")

            user = SupabaseUser(
                supabase_uid=response.user.id,
                email=response.user.email or ""
            )

            return (user, token)

        except exceptions.AuthenticationFailed:
            raise
        except Exception as error:
            raise exceptions.AuthenticationFailed(f"Authentication failed: {str(error)}")
