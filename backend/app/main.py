from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import config
from app.api.routes import router

app = FastAPI(title="BizPilot AI")
app.add_middleware(CORSMiddleware, allow_origins=config.CORS_ORIGINS,
                   allow_methods=["*"], allow_headers=["*"])
app.include_router(router)
