from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime


class ErrorResponse(BaseModel):
    detail: str
    error_code: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class HealthResponse(BaseModel):
    application: str
    status: str
    version: str
    environment: str


class ModelDetail(BaseModel):
    name: str
    status: str
    path: str
    provider: str = "CPU"


class ModelStatusResponse(BaseModel):
    status: str
    device: str
    models: Dict[str, str]
    details: Dict[str, ModelDetail]
    readiness: bool
