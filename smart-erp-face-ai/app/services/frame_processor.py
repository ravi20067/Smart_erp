import cv2
import numpy as np
from typing import List, Tuple
from fastapi import UploadFile, HTTPException
from app.config.settings import settings


class FrameProcessor:
    ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}

    @classmethod
    async def decode_upload_files(
        cls,
        files: List[UploadFile]
    ) -> List[np.ndarray]:
        """
        Validates and decodes a list of uploaded image files into OpenCV BGR numpy arrays.
        """
        if not files:
            raise HTTPException(status_code=400, detail="No frame files provided in batch")

        if len(files) > settings.MAX_FRAMES_PER_BATCH:
            raise HTTPException(
                status_code=400,
                detail=f"Frame batch size exceeds maximum limit of {settings.MAX_FRAMES_PER_BATCH} frames"
            )

        max_bytes = settings.MAX_IMAGE_SIZE_MB * 1024 * 1024
        decoded_frames: List[np.ndarray] = []

        for idx, file in enumerate(files):
            # Check content type if available
            if file.content_type and file.content_type not in cls.ALLOWED_CONTENT_TYPES:
                raise HTTPException(
                    status_code=415,
                    detail=f"File '{file.filename}' has unsupported media type: {file.content_type}. Only JPEG and PNG allowed."
                )

            content = await file.read()
            if not content:
                raise HTTPException(
                    status_code=400,
                    detail=f"Frame '{file.filename or idx}' is empty (0 bytes)"
                )

            if len(content) > max_bytes:
                raise HTTPException(
                    status_code=413,
                    detail=f"Frame '{file.filename or idx}' exceeds maximum size of {settings.MAX_IMAGE_SIZE_MB}MB"
                )

            # Decode image
            encoded = np.frombuffer(content, dtype=np.uint8)
            frame = cv2.imdecode(encoded, cv2.IMREAD_COLOR)

            if frame is None:
                raise HTTPException(
                    status_code=400,
                    detail=f"Frame '{file.filename or idx}' could not be decoded as a valid image"
                )

            decoded_frames.append(frame)

        return decoded_frames

    @classmethod
    def decode_image_bytes(cls, content: bytes) -> np.ndarray:
        if not content:
            raise HTTPException(status_code=400, detail="Image content is empty")

        max_bytes = settings.MAX_IMAGE_SIZE_MB * 1024 * 1024
        if len(content) > max_bytes:
            raise HTTPException(
                status_code=413,
                detail=f"Image exceeds maximum size of {settings.MAX_IMAGE_SIZE_MB}MB"
            )

        encoded = np.frombuffer(content, dtype=np.uint8)
        frame = cv2.imdecode(encoded, cv2.IMREAD_COLOR)
        if frame is None:
            raise HTTPException(status_code=400, detail="Failed to decode image data")
        return frame
