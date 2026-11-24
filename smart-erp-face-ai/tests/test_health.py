from fastapi.testclient import TestClient


def test_root_endpoint_json(client: TestClient):
    response = client.get("/", headers={"accept": "application/json"})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "RUNNING"
    assert "version" in data
    assert "interactive_ui" in data


def test_root_endpoint_html(client: TestClient):
    response = client.get("/", headers={"accept": "text/html"})
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]
    assert "Smart ERP Face AI" in response.text


def test_ui_endpoint(client: TestClient):
    response = client.get("/ui")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]
    assert "Live Camera Feed" in response.text
    assert "Randomized Liveness" in response.text


def test_health_root(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "UP"
    assert "application" in data
    assert "version" in data


def test_health_prefixed(client: TestClient):
    response = client.get("/internal/v1/face/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "UP"
