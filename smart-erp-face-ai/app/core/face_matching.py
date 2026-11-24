
import numpy as np


class FaceMatcher:

    @staticmethod
    def compare(
        enrolled_embedding: list[float],
        captured_embedding: list[float]
    ) -> float:

        enrolled = np.asarray(enrolled_embedding, dtype=np.float32)
        captured = np.asarray(captured_embedding, dtype=np.float32)

        if enrolled.shape != (128,) or captured.shape != (128,):
            raise ValueError("Both embeddings must contain 128 values")

        if not np.all(np.isfinite(enrolled)) or not np.all(np.isfinite(captured)):
            raise ValueError("Embedding contains invalid values")

        enrolled_norm = np.linalg.norm(enrolled)
        captured_norm = np.linalg.norm(captured)

        if enrolled_norm == 0 or captured_norm == 0:
            raise ValueError("Invalid zero embedding")

        similarity = np.dot(
            enrolled / enrolled_norm,
            captured / captured_norm
        )

        return float(np.clip(similarity, -1.0, 1.0))
