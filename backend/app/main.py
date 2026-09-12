import time
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("api")

app = FastAPI(title="Vehicle Log Manager API", version="0.1.0")

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"[Backend] Request: {request.method} {request.url.path}")
    start_time = time.time()
    
    response = await call_next(request)
    
    process_time = (time.time() - start_time) * 1000
    logger.info(f"[Backend] Response: {response.status_code} {request.url.path} (took {process_time:.2f}ms)")
    
    return response

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten before production — restrict to the RN app's origin / Expo dev URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.api_v1_prefix)


@app.get("/")
def health():
    return {"status": "ok", "environment": settings.environment}
