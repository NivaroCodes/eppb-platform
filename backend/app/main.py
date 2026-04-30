from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import forms, submissions, mock

app = FastAPI(
    title="EPPB Platform API",
    description="No-code form builder platform",
    version="0.1.0",
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
app.include_router(mock.router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "eppb-backend"}