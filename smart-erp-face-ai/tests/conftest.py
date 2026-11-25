import os
from pathlib import Path
import pytest

# Ensure working directory is smart-erp-face-ai directory during tests
os.chdir(Path(__file__).resolve().parent.parent)

from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c
