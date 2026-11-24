from fastapi import Header, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional

from app.config.settings import settings


security_bearer = HTTPBearer(auto_error=False)


async def verify_internal_auth(
    x_internal_api_key: Optional[str] = Header(None, alias="X-Internal-API-Key"),
    auth_credentials: Optional[HTTPAuthorizationCredentials] = Security(security_bearer)
):
    """
    Validates internal service requests from Spring Boot.
    Can be authenticated via X-Internal-API-Key header or Authorization: Bearer <key>.
    """
    if not settings.REQUIRE_INTERNAL_AUTH and not settings.INTERNAL_API_KEY:
        # Auth not strictly required in dev unless key configured
        return True

    expected_key = settings.INTERNAL_API_KEY
    if not expected_key:
        return True

    # Check header
    if x_internal_api_key and x_internal_api_key == expected_key:
        return True

    # Check bearer token
    if auth_credentials and auth_credentials.credentials == expected_key:
        return True

    raise HTTPException(
        status_code=401,
        detail="Unauthorized: Invalid or missing internal service API key",
        headers={"WWW-Authenticate": "Bearer"}
    )
