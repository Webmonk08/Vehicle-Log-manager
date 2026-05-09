from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import traceback
import sys

from app.core.config import get_settings
from app.api.v1.router import api_router

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    description="Full-stack Vehicle Log Manager API — manage drivers, vehicles, trips, loads, and financial ledger.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — allow Expo dev client
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://vr-app-backend.onrender.com" , "exp://10.177.25.42:8081"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle Pydantic validation errors and print them."""
    print(f"\n--- VALIDATION ERROR: {request.method} {request.url} ---", file=sys.stderr)
    print(f"Details: {exc.errors()}", file=sys.stderr)
    print("--- END VALIDATION ERROR ---\n", file=sys.stderr)
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": exc.body},
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handle HTTP exceptions and print them."""
    print(f"\n--- HTTP ERROR {exc.status_code}: {request.method} {request.url} ---", file=sys.stderr)
    print(f"Detail: {exc.detail}", file=sys.stderr)
    print("--- END HTTP ERROR ---\n", file=sys.stderr)
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch unhandled exceptions and print full traceback."""
    print(f"\n--- UNHANDLED EXCEPTION: {request.method} {request.url} ---", file=sys.stderr)
    traceback.print_exc()
    print("--- END UNHANDLED EXCEPTION ---\n", file=sys.stderr)
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"},
    )


# Include API routes
app.include_router(api_router)


@app.get("/", tags=["Health"])
async def health_check():
    return {"status": "ok", "app": settings.app_name}
