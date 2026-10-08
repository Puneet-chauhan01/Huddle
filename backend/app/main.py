import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import meetings
from app.database import engine
from app.models import models

# Ensure all database tables are created automatically on startup
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Zoom Clone API",
    description="Backend API for Zoom Clone web conferencing application",
    version="1.0.0"
)

# Base allowed origins including local dev and deployed production frontend
# Both without and with trailing slash to ensure exact match regardless of client/proxy headers
default_origins = [
    "http://localhost:3000",
    "http://localhost:3000/",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3000/",
    "http://localhost:3001",
    "http://localhost:3001/",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3001/",
    "https://huddle-gamma-three.vercel.app",
    "https://huddle-gamma-three.vercel.app/",
]

# Configure CORS using FRONTEND_URL environment variable if provided
frontend_url_env = os.getenv("FRONTEND_URL", "")

allowed_origins = list(default_origins)

if frontend_url_env:
    for origin in frontend_url_env.split(","):
        cleaned = origin.strip()
        base = cleaned.rstrip("/")
        if base and base != "*":
            if base not in allowed_origins:
                allowed_origins.append(base)
            if f"{base}/" not in allowed_origins:
                allowed_origins.append(f"{base}/")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?/?$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=86400,
)

# Register API routes
app.include_router(meetings.router)

# Health check endpoints
@app.get("/health", tags=["Health"])
@app.get("/api/health", tags=["Health"])
def health_check():
    return {"status": "ok"}
