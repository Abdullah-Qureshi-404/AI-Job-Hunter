"""
ApplyAI JWT Authentication Guard

Protects private routes.

Flow:

JWT Token
   |
   ↓
Supabase verification
   |
   ↓
user_id extracted
"""


from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from core.supabase import supabase
from core import jwt_verify



security = HTTPBearer()



def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Verify Supabase JWT token.
    """

    token = credentials.credentials

    # 1. Offline signature check - no network.
    try:
        local = jwt_verify.verify_locally(token)
    except jwt_verify.TokenError as error:
        raise HTTPException(status_code=401, detail=str(error))

    if local:
        return local

    # 2. Remote check, cached so repeat calls with the same token are free.
    cached = jwt_verify.cache_get(token)

    if cached:
        return cached

    try:

        response = supabase.auth.get_user(
            token
        )


        if not response.user:

            raise HTTPException(
                status_code=401,
                detail="Invalid authentication token"
            )


        value = {
            "user_id": response.user.id,
            "email": response.user.email
        }

        jwt_verify.cache_put(
            token,
            value,
            jwt_verify.token_expiry(token),
        )

        return value


    except HTTPException:
        raise


    except Exception:

        raise HTTPException(
            status_code=401,
            detail="Authentication failed"
        )