import pytest
import numpy as np
from app.core.face_matching import FaceMatcher


def test_identical_embeddings():
    emb = np.random.randn(128).astype(np.float32)
    emb /= np.linalg.norm(emb)
    sim = FaceMatcher.compare(emb.tolist(), emb.tolist())
    assert pytest.approx(sim, abs=1e-5) == 1.0


def test_orthogonal_embeddings():
    emb1 = np.zeros(128, dtype=np.float32)
    emb2 = np.zeros(128, dtype=np.float32)
    emb1[0] = 1.0
    emb2[1] = 1.0
    sim = FaceMatcher.compare(emb1.tolist(), emb2.tolist())
    assert pytest.approx(sim, abs=1e-5) == 0.0


def test_opposite_embeddings():
    emb1 = np.ones(128, dtype=np.float32)
    emb2 = -np.ones(128, dtype=np.float32)
    sim = FaceMatcher.compare(emb1.tolist(), emb2.tolist())
    assert pytest.approx(sim, abs=1e-5) == -1.0


def test_incorrect_dimension():
    short_emb = [0.1] * 120
    valid_emb = [0.1] * 128
    with pytest.raises(ValueError, match="128 values"):
        FaceMatcher.compare(short_emb, valid_emb)

    long_emb = [0.1] * 256
    with pytest.raises(ValueError, match="128 values"):
        FaceMatcher.compare(valid_emb, long_emb)


def test_nan_values():
    emb1 = [0.1] * 128
    emb2 = [0.1] * 128
    emb2[5] = float("nan")
    with pytest.raises(ValueError, match="invalid values"):
        FaceMatcher.compare(emb1, emb2)


def test_infinite_values():
    emb1 = [0.1] * 128
    emb2 = [0.1] * 128
    emb2[10] = float("inf")
    with pytest.raises(ValueError, match="invalid values"):
        FaceMatcher.compare(emb1, emb2)

    emb2[10] = float("-inf")
    with pytest.raises(ValueError, match="invalid values"):
        FaceMatcher.compare(emb1, emb2)


def test_zero_vector():
    zero_emb = [0.0] * 128
    valid_emb = [0.1] * 128
    with pytest.raises(ValueError, match="Invalid zero embedding"):
        FaceMatcher.compare(zero_emb, valid_emb)
