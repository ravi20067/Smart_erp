
from pydantic import BaseModel, Field


class FaceEnrollmentResult(BaseModel):
    face_detected: bool
    face_quality_passed: bool
    embedding: list[float] | None = None
    embedding_dimensions: int = 0
    status: str


class FaceComparisonRequest(BaseModel):
    enrolled_embedding: list[float] = Field(
        min_length=128,
        max_length=128
    )

    captured_embedding: list[float] = Field(
        min_length=128,
        max_length=128
    )


class FaceComparisonResult(BaseModel):
    similarity: float
    matched: bool
    status: str
