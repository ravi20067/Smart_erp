import time
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.config.settings import settings
import numpy as np
import cv2


def test_unauthorized_access_when_auth_enabled(client: TestClient, monkeypatch):
    monkeypatch.setattr(settings, "INTERNAL_API_KEY", "super-secret-key-12345")
    monkeypatch.setattr(settings, "REQUIRE_INTERNAL_AUTH", True)

    # 1. Request without header should be rejected 401
    resp = client.post(
        "/internal/v1/face/sessions",
        json={"session_id": "TEST-AUTH-1"}
    )
    assert resp.status_code == 401
    assert "Unauthorized" in resp.json()["detail"]

    # 2. Request with invalid header should be rejected 401
    resp = client.post(
        "/internal/v1/face/sessions",
        json={"session_id": "TEST-AUTH-1"},
        headers={"X-Internal-API-Key": "wrong-key"}
    )
    assert resp.status_code == 401

    # 3. Request with valid header should succeed 201
    resp = client.post(
        "/internal/v1/face/sessions",
        json={"session_id": "TEST-AUTH-OK"},
        headers={"X-Internal-API-Key": "super-secret-key-12345"}
    )
    assert resp.status_code == 201

    # Clean up
    client.delete(
        "/internal/v1/face/sessions/TEST-AUTH-OK",
        headers={"X-Internal-API-Key": "super-secret-key-12345"}
    )


def test_expired_session_frame_rejection(client: TestClient):
    # Create session with 1s TTL
    resp = client.post(
        "/internal/v1/face/sessions",
        json={"session_id": "TEST-EXP-FRAMES", "expires_in_seconds": 1}
    )
    assert resp.status_code == 201
    time.sleep(1.2)

    with open("test_images/face.jpg", "rb") as f:
        img_bytes = f.read()

    files = [("frames", ("frame1.jpg", img_bytes, "image/jpeg"))]
    frame_resp = client.post(
        "/internal/v1/face/sessions/TEST-EXP-FRAMES/frames",
        data={"action": "LOOK_STRAIGHT", "sequence_number": 1},
        files=files
    )
    assert frame_resp.status_code == 410
    assert "expired" in frame_resp.json()["detail"].lower()


def test_invalid_session_frame_rejection(client: TestClient):
    with open("test_images/face.jpg", "rb") as f:
        img_bytes = f.read()

    files = [("frames", ("frame1.jpg", img_bytes, "image/jpeg"))]
    frame_resp = client.post(
        "/internal/v1/face/sessions/NON-EXISTENT-SESSION/frames",
        data={"action": "LOOK_STRAIGHT", "sequence_number": 1},
        files=files
    )
    assert frame_resp.status_code == 404


def test_empty_image_upload_rejected(client: TestClient):
    resp = client.post(
        "/internal/v1/face/analyze",
        files={"image": ("empty.jpg", b"", "image/jpeg")}
    )
    assert resp.status_code in (400, 422)


def test_oversized_image_upload_rejected(client: TestClient, monkeypatch):
    # Temporarily set max size to 1MB to test limit
    monkeypatch.setattr(settings, "MAX_IMAGE_SIZE_MB", 1)
    fake_huge_image = b"0" * (2 * 1024 * 1024)

    resp = client.post(
        "/internal/v1/face/analyze",
        files={"image": ("huge.jpg", fake_huge_image, "image/jpeg")}
    )
    assert resp.status_code == 413


def test_concurrent_sessions_isolation(client: TestClient):
    # Create two independent sessions
    resp1 = client.post(
        "/internal/v1/face/sessions",
        json={"session_id": "SESSION-STUDENT-A", "challenge_id": "CH-A"}
    )
    resp2 = client.post(
        "/internal/v1/face/sessions",
        json={"session_id": "SESSION-STUDENT-B", "challenge_id": "CH-B"}
    )
    assert resp1.status_code == 201
    assert resp2.status_code == 201

    with open("test_images/face.jpg", "rb") as f:
        img_bytes = f.read()

    # Session A completes LOOK_STRAIGHT (needs at least 2 frames for sustained pose)
    files = [
        ("frames", ("f1.jpg", img_bytes, "image/jpeg")),
        ("frames", ("f2.jpg", img_bytes, "image/jpeg"))
    ]
    client.post(
        "/internal/v1/face/sessions/SESSION-STUDENT-A/frames",
        data={"action": "LOOK_STRAIGHT", "sequence_number": 1},
        files=files
    )

    # Verify Session A evidence has action, while Session B does not
    ev_a = client.get("/internal/v1/face/sessions/SESSION-STUDENT-A/liveness").json()
    ev_b = client.get("/internal/v1/face/sessions/SESSION-STUDENT-B/liveness").json()

    assert "LOOK_STRAIGHT" in ev_a["detected_challenge_actions"]
    assert "LOOK_STRAIGHT" not in ev_b["detected_challenge_actions"]

    # Cleanup
    client.delete("/internal/v1/face/sessions/SESSION-STUDENT-A")
    client.delete("/internal/v1/face/sessions/SESSION-STUDENT-B")
