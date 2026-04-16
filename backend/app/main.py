from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers.dashboard import router as dashboard_router
from .routers.historical import router as historical_router
from .routers.ingest import router as ingest_router
from .routers.insights import router as insights_router
from .routers.settings import router as settings_router

app = FastAPI(title="Smart Monitoring API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard_router, prefix="/api")
app.include_router(historical_router, prefix="/api")
app.include_router(ingest_router, prefix="/api")
app.include_router(insights_router, prefix="/api")
app.include_router(settings_router, prefix="/api")


@app.get("/health")
def health_check():
    return {"ok": True}
