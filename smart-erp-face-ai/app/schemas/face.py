from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class FaceEnrollmentResult(BaseModel):
    face_detected: bool
    face_quality_passed: bool
    embedding: Optional[List[float]] = None
    embedding_dimensions: int = 0
    images_processed: int = 1
    quality_details: Dict[str, Any] = Field(default_factory=dict)
    anti_spoof: Dict[str, Any] = Field(default_factory=dict)
    status: str


class FaceComparisonRequest(BaseModel):
    enrolled_embedding: List[float] = Field(
        ...,
        min_length=128,
        max_length=128,
        description="128-dimensional enrolled biometric vector"
    )
    captured_embedding: List[float] = Field(
        ...,
        min_length=128,
        max_length=128,
        description="128-dimensional captured biometric vector"
    )
    session_id: Optional[str] = Field(
        default=None,
        description="Optional session or student reference"
    )


class FaceComparisonResult(BaseModel):
    similarity: float
    matched: bool
    status: str
    threshold_used: Optional[float] = None
    session_id: Optional[str] = None


class FaceDiagnosticResult(BaseModel):
    face_detected: bool
    face_count: int
    face_quality_passed: bool
    quality_details: Dict[str, Any] = Field(default_factory=dict)
    anti_spoof: Dict[str, Any] = Field(default_factory=dict)
    landmarks_detected: bool = False
    ear: Optional[float] = None
    embedding_dimensions: int = 0
    status: str
