
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.core.face_pipeline import FacePipeline
from app.api.verification import router as verification_router

from app.api.matching import router as matching_router




@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Loading Smart ERP Face AI models...")

    pipeline = FacePipeline()
    app.state.pipeline = pipeline

    print("All face AI models loaded successfully.")

    yield

    app.state.pipeline = None
    print("Face AI service stopped.")


app = FastAPI(
    title="Smart ERP Face AI",
    description="Face detection, recognition and anti-spoofing service",
    version="1.0.0",
    lifespan=lifespan
)


app.include_router(verification_router)
app.include_router(matching_router)

@app.get("/")
def root():
    return {
        "application": "Smart ERP Face AI",
        "status": "RUNNING"
    }


@app.get("/health")
def health():
    pipeline = getattr(app.state, "pipeline", None)

    return {
        "status": "UP" if pipeline is not None else "STARTING",
        "models": {
            "yunet": "LOADED" if pipeline is not None else "NOT_LOADED",
            "sface": "LOADED" if pipeline is not None else "NOT_LOADED",
            "minifasnet": "LOADED" if pipeline is not None else "NOT_LOADED"
        },
        "device": "CPU"
    }
