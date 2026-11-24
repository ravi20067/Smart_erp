from fastapi.testclient import TestClient


def test_models_status_endpoint(client: TestClient):
    response = client.get("/internal/v1/face/models/status")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "READY"
    assert data["device"] == "CPU"
    assert data["readiness"] is True
    assert "yunet" in data["models"]
    assert "sface" in data["models"]
    assert "minifasnet" in data["models"]
    assert "landmarks" in data["models"]
    assert data["models"]["yunet"] == "LOADED"
    assert data["models"]["sface"] == "LOADED"
    assert data["models"]["minifasnet"] == "LOADED"
    assert data["models"]["landmarks"] == "LOADED"


def test_models_status_unprefixed(client: TestClient):
    response = client.get("/models/status")
    assert response.status_code == 200
    data = response.json()
    assert data["readiness"] is True
