from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .db_client import close_db_pool
from .routers import admin

app = FastAPI(title="Camp Admin API", version="0.1.0")

settings = get_settings()

app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

app.include_router(admin.router)


@app.get("/health")
def health_check():
  return {"status": "ok"}


@app.on_event("shutdown")
def shutdown_event():
  close_db_pool()


__all__ = ["app"]
