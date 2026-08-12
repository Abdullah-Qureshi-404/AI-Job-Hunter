import os
from django.conf import settings
from rest_framework import authentication
from rest_framework import exceptions
from supabase import create_client, Client

from core import jwt_verify


class SupabaseUser:
    """
    Lightweight user object representing an authenticated Supabase user.
    """

    def __init__(self, supabase_uid: str, email: str):
        self.id = supabase_uid
        self.supabase_uid = supabase_uid
        self.pk = supabase_uid
        self.email = email
        self.is_authenticated = True

    @property
    def pk(self):
        return self.supabase_uid

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

        # 1. Offline signature check. No network, ~0.1 ms.
        try:
            local = jwt_verify.verify_locally(token)
        except jwt_verify.TokenError as error:
            raise exceptions.AuthenticationFailed(str(error))

        if local:
            uid, email = local
            return (SupabaseUser(supabase_uid=uid, email=email), token)

        # 2. No JWT secret configured. Fall back to asking Supabase, but only
        #    once per token per TTL - otherwise every request pays ~515 ms.
        cached = jwt_verify.cache_get(token)

        if cached:
            uid, email = cached
            return (SupabaseUser(supabase_uid=uid, email=email), token)

        try:
            client = self._get_supabase_client()
            response = client.auth.get_user(token)

            if not response or not response.user:
                raise exceptions.AuthenticationFailed("Invalid authentication token")

            value = (response.user.id, response.user.email or "")

            jwt_verify.cache_put(token, value, jwt_verify.token_expiry(token))

            uid, email = value
            return (SupabaseUser(supabase_uid=uid, email=email), token)

        except exceptions.AuthenticationFailed:
            raise
        except Exception as error:
            raise exceptions.AuthenticationFailed(f"Authentication failed: {str(error)}")
