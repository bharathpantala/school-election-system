import os
import sys

if __package__ is None or __package__ == "":
    backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if backend_root not in sys.path:
        sys.path.insert(0, backend_root)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine, ensure_schema_compatibility
from app.routers import auth, elections
import uvicorn

Base.metadata.create_all(bind=engine)
ensure_schema_compatibility()

app = FastAPI(title="School Election System API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(elections.router)


@app.get("/")
def health_check():
    return {
        "message": "School Election System API is running",
        "kiosk_vote_gap_seconds": settings.kiosk_vote_gap_seconds,
    }


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, log_level="info", reload=True)
