import cv2
import numpy as np
import pytest
from fastapi import HTTPException
from app.services.enrollment_service import EnrollmentService
from app.core.face_pipeline import FacePipeline


@pytest.fixture(scope="module")
def pipeline():
    return FacePipeline()


@pytest.fixture(scope="module")
def enrollment_service(pipeline):
    return EnrollmentService(
        detector=pipeline.detector,
        recognizer=pipeline.recognizer,
        anti_spoof=pipeline.anti_spoof
    )


def test_enrollment_valid_image(enrollment_service):
    img = cv2.imread("test_images/face.jpg")
    res = enrollment_service.extract_enrollment_embedding([img])
    assert res["face_detected"] is True
    assert res["face_quality_passed"] is True
    assert res["embedding_dimensions"] == 128
    assert len(res["embedding"]) == 128
    assert res["status"] == "ENROLLMENT_EXTRACTED"
    # Verify embedding is unit-normalized
    norm = np.linalg.norm(res["embedding"])
    assert pytest.approx(norm, abs=1e-3) == 1.0


def test_enrollment_no_face_fails(enrollment_service):
    # Blank image
    blank = np.zeros((480, 640, 3), dtype=np.uint8)
    with pytest.raises(HTTPException) as exc_info:
        enrollment_service.extract_enrollment_embedding([blank])
    assert exc_info.value.status_code == 422
    assert "No face detected" in exc_info.value.detail


def test_enrollment_multiple_faces_fails(enrollment_service):
    img = cv2.imread("test_images/face.jpg")
    # Concatenate two faces side by side to make an image with 2 faces
    h, w = img.shape[:2]
    multi = np.zeros((h, w * 2, 3), dtype=np.uint8)
    multi[:, :w] = img
    multi[:, w:] = img
    with pytest.raises(HTTPException) as exc_info:
        enrollment_service.extract_enrollment_embedding([multi])
    assert exc_info.value.status_code == 422
    assert "Multiple faces detected" in exc_info.value.detail


def test_enrollment_multiple_consistent_images(enrollment_service):
    img1 = cv2.imread("test_images/face.jpg")
    # Slight brightness variation of the same face
    img2 = cv2.convertScaleAbs(img1, alpha=1.05, beta=5)
    res = enrollment_service.extract_enrollment_embedding([img1, img2])
    assert res["images_processed"] == 2
    assert res["embedding_dimensions"] == 128
    assert res["status"] == "ENROLLMENT_EXTRACTED"
