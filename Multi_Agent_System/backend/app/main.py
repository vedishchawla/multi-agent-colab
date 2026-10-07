"""CollaborAI Main FastAPI Application Entrypoint.

PS-27: Collaborative Multi-Agent Decision Intelligence System.
"""

import logging
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import settings
from .db.session import init_db
from .api import runs_router, scenarios_router, ws_router
from .llm import get_llm_provider, rate_limiter

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s"
)
logger = logging.getLogger("collaborai.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown hooks."""
    logger.info("Initializing CollaborAI database and subsystems...")
    await init_db()
    logger.info("CollaborAI backend started successfully.")
    yield
    logger.info("CollaborAI backend shutting down.")


app = FastAPI(
    title="CollaborAI: Collaborative Multi-Agent Decision Intelligence System",
    description="Backend API powering PS-27 multi-agent coordination, blackboard state, conflict negotiation, and attribution.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for React/Vite development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(runs_router)
app.include_router(scenarios_router)
app.include_router(ws_router)

@app.get("/api/status")
async def system_status():
    """System welcome and status metadata endpoint."""
    llm = get_llm_provider()
    provider_name = llm.__class__.__name__
    return {
        "system": "CollaborAI – Collaborative Multi-Agent Decision Intelligence System",
        "specification": "PS-27",
        "status": "online",
        "llm_provider": provider_name,
        "llm_provider_setting": settings.LLM_PROVIDER,
        "simulation_mode": settings.SIMULATION_MODE,
        "model_configured": (
            settings.GROQ_MODEL if "Groq" in provider_name
            else settings.GEMINI_MODEL if "Gemini" in provider_name
            else "mock"
        ),
        "docs_url": "/docs"
    }


@app.get("/api/health")
async def health_check():
    """Health status and telemetry endpoint."""
    llm = get_llm_provider()
    llm_health = await llm.health_check()
    return {
        "status": "healthy",
        "llm_provider": llm.__class__.__name__,
        "llm_health": llm_health,
        "rate_limiter_telemetry": rate_limiter.get_telemetry()
    }


@app.get("/health")
async def health_check_compat():
    """Compatibility alias for /health."""
    return await health_check()


# Mount compiled frontend static build if present
FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if FRONTEND_DIST.exists():
    logger.info("Mounting compiled React frontend from %s", FRONTEND_DIST)
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIST), html=True), name="frontend")
else:
    @app.get("/")
    async def root():
        """System welcome and status endpoint when frontend dist is not built."""
        return {
            "system": "CollaborAI – Collaborative Multi-Agent Decision Intelligence System",
            "specification": "PS-27",
            "status": "online",
            "simulation_mode": settings.SIMULATION_MODE,
            "model_configured": settings.GEMINI_MODEL,
            "docs_url": "/docs"
        }
