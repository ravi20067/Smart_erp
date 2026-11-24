import asyncio
import logging
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse, HTMLResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware

from app.config.settings import settings
from app.core.face_pipeline import FacePipeline
from app.services.session_processor import SessionProcessor
from app.services.liveness_service import LivenessService
from app.services.enrollment_service import EnrollmentService

# Import API Routers
from app.api.health import router as health_router
from app.api.models import router as models_router
from app.api.sessions import router as sessions_router
from app.api.frames import router as frames_router
from app.api.liveness import router as liveness_router
from app.api.enrollment import router as enrollment_router
from app.api.recognition import router as recognition_router
from app.api.diagnostics import router as diagnostics_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("smart_erp_face_ai")

STATIC_INDEX = Path(__file__).parent / "static" / "index.html"


async def periodic_session_cleanup(session_processor: SessionProcessor):
    """Background task to periodically purge expired session memory."""
    try:
        while True:
            await asyncio.sleep(settings.SESSION_CLEANUP_INTERVAL_SECONDS)
            pruned = session_processor.cleanup_expired_sessions()
            if pruned > 0:
                logger.info(f"Cleaned up {pruned} expired verification session(s)")
    except asyncio.CancelledError:
        pass


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Smart ERP Face AI microservice...")

    # Load unified pipeline (YuNet, SFace, MiniFASNet, MediaPipe Landmarker, LivenessEngine)
    pipeline = FacePipeline()
    session_processor = SessionProcessor()
    liveness_service = LivenessService(
        engine=pipeline.liveness_engine,
        session_processor=session_processor
    )
    enrollment_service = EnrollmentService(
        detector=pipeline.detector,
        recognizer=pipeline.recognizer,
        anti_spoof=pipeline.anti_spoof
    )

    app.state.pipeline = pipeline
    app.state.session_processor = session_processor
    app.state.liveness_service = liveness_service
    app.state.enrollment_service = enrollment_service

    # Start periodic session cleanup task
    cleanup_task = asyncio.create_task(periodic_session_cleanup(session_processor))
    logger.info("Smart ERP Face AI models and services loaded successfully.")

    yield

    cleanup_task.cancel()
    await asyncio.gather(cleanup_task, return_exceptions=True)

    app.state.pipeline = None
    app.state.session_processor = None
    app.state.liveness_service = None
    app.state.enrollment_service = None
    logger.info("Smart ERP Face AI microservice stopped cleanly.")


app = FastAPI(
    title=settings.APP_NAME,
    description="Commercial SaaS Smart ERP Face AI microservice for active liveness challenge verification, face enrollment, and face recognition.",
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware for Spring Boot gateway and browser UI integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Exception handler to prevent leaking raw tracebacks
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error processing {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An internal error occurred during Face AI processing",
            "error_type": exc.__class__.__name__
        }
    )


# 1. Primary API router group with standard prefix: /internal/v1/face
api_prefix = settings.API_V1_PREFIX

app.include_router(health_router, prefix=api_prefix)
app.include_router(models_router, prefix=api_prefix)
app.include_router(sessions_router, prefix=api_prefix)
app.include_router(frames_router, prefix=api_prefix)
app.include_router(liveness_router, prefix=api_prefix)
app.include_router(enrollment_router, prefix=api_prefix)
app.include_router(recognition_router, prefix=api_prefix)
app.include_router(diagnostics_router, prefix=api_prefix)

# 2. Backwards-compatibility and root health routes
app.include_router(health_router, prefix="")
app.include_router(models_router, prefix="")
app.include_router(diagnostics_router, prefix="/internal/face")
app.include_router(recognition_router, prefix="/internal/face")


# 3. Interactive Web Camera Testing UI
@app.get("/ui", response_class=HTMLResponse, tags=["Webcam Testing Studio"])
@app.get("/demo", response_class=HTMLResponse, tags=["Webcam Testing Studio"])
def serve_testing_ui():
    if STATIC_INDEX.exists():
        return HTMLResponse(content=STATIC_INDEX.read_text(encoding="utf-8"))
    return HTMLResponse(content="<h3>UI not found</h3>", status_code=404)


@app.get("/", tags=["Root"])
def root(request: Request):
    # If opened in browser directly, serve the interactive Camera Testing UI
    accept_header = request.headers.get("accept", "")
    if "text/html" in accept_header and STATIC_INDEX.exists():
        return HTMLResponse(content=STATIC_INDEX.read_text(encoding="utf-8"))

    return {
        "application": settings.APP_NAME,
        "version": settings.VERSION,
        "status": "RUNNING",
        "interactive_ui": "/ui",
        "api_documentation": "/docs",
        "endpoints_prefix": settings.API_V1_PREFIX
    }
