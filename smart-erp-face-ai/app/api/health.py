from fastapi import APIRouter
from app.schemas.common import HealthResponse
from app.config.settings import settings

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
def get_health():
    return HealthResponse(
        application=settings.APP_NAME,
        status="UP",
        version=settings.VERSION,
        environment=settings.APP_ENV
    )
