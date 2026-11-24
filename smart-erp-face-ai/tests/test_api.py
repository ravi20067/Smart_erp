import io
import pytest
import numpy as np
from fastapi.testclient import TestClient


def test_face_comparison_api_identical(client: TestClient):
    emb = [float(x) for x in np.random.randn(128)]
    norm = np.linalg.norm(emb)
    emb = [x / norm for x in emb]

    response = client.post(
        "/internal/v1/face/compare",
        json={
            "enrolled_embedding": emb,
            "captured_embedding": emb,
            "session_id": "TEST-VERIFY"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert pytest.approx(data["similarity"], abs=1e-3) == 1.0


def test_face_comparison_api_invalid_dimensions(client: TestClient):
    response = client.post(
        "/internal/v1/face/compare",
        json={
            "enrolled_embedding": [0.1] * 120,
            "captured_embedding": [0.1] * 128
        }
    )
    assert response.status_code == 422  # Pydantic validation error


def test_diagnostic_analyze_api(client: TestClient):
    with open("test_images/face.jpg", "rb") as f:
        img_bytes = f.read()

    response = client.post(
        "/internal/v1/face/analyze",
        files={"image": ("face.jpg", img_bytes, "image/jpeg")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["face_detected"] is True
    assert data["face_count"] == 1
    assert "anti_spoof" in data
    assert data["anti_spoof"]["label"] == "LIVE_FACE"
    assert "embedding" not in data  # Diagnostic must not expose raw embedding


def test_diagnostic_backwards_compatible_analyze(client: TestClient):
    with open("test_images/face.jpg", "rb") as f:
        img_bytes = f.read()

    response = client.post(
        "/internal/face/analyze",
        files={"image": ("face.jpg", img_bytes, "image/jpeg")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["face_detected"] is True


def test_end_to_end_challenge_session_flow(client: TestClient):
    # 1. Spring Boot initializes session
    create_resp = client.post(
        "/internal/v1/face/sessions",
        json={
            "session_id": "TEST-FLOW-101",
            "challenge_id": "CH-101",
            "expires_in_seconds": 60
        }
    )
    assert create_resp.status_code == 201
    assert create_resp.json()["session_id"] == "TEST-FLOW-101"

    # 2. Check session status
    st_resp = client.get("/internal/v1/face/sessions/TEST-FLOW-101")
    assert st_resp.status_code == 200
    assert st_resp.json()["processing_status"] == "ACTIVE"

    # 3. Post frames for action LOOK_STRAIGHT
    with open("test_images/face.jpg", "rb") as f:
        img_bytes = f.read()

    files = [
        ("frames", ("frame1.jpg", img_bytes, "image/jpeg")),
        ("frames", ("frame2.jpg", img_bytes, "image/jpeg"))
    ]
    frame_resp = client.post(
        "/internal/v1/face/sessions/TEST-FLOW-101/frames",
        data={
            "action": "LOOK_STRAIGHT",
            "sequence_number": 1,
            "challenge_id": "CH-101"
        },
        files=files
    )
    assert frame_resp.status_code == 200
    frame_data = frame_resp.json()
    assert frame_data["session_id"] == "TEST-FLOW-101"
    assert frame_data["action"] == "LOOK_STRAIGHT"
    assert frame_data["accepted"] is True
    assert frame_data["status"] == "CHALLENGE_DETECTED"

    # 4. Check liveness evidence
    live_resp = client.get("/internal/v1/face/sessions/TEST-FLOW-101/liveness")
    assert live_resp.status_code == 200
    evidence = live_resp.json()
    assert "LOOK_STRAIGHT" in evidence["detected_challenge_actions"]

    # 5. Complete session
    comp_resp = client.post("/internal/v1/face/sessions/TEST-FLOW-101/complete")
    assert comp_resp.status_code == 200
    assert comp_resp.json()["status"] == "COMPLETED"

    # 6. Delete session
    del_resp = client.delete("/internal/v1/face/sessions/TEST-FLOW-101")
    assert del_resp.status_code == 200
    assert del_resp.json()["status"] == "DELETED"

    # 7. Verify session no longer exists
    get_del = client.get("/internal/v1/face/sessions/TEST-FLOW-101")
    assert get_del.status_code == 404
