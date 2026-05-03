from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import forms, submissions, mock
from app.services.seed_forms import run_startup_seed


@asynccontextmanager
async def lifespan(app: FastAPI):
    await run_startup_seed()
    yield


app = FastAPI(
    title="EPPB Platform API",
    description="No-code form builder platform",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # На проде заменить на конкретные домены
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(forms.router)
app.include_router(submissions.router)
app.include_router(submissions.api_forms_router)
app.include_router(mock.router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "eppb-backend"}