from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from app.core.config import get_settings
from supabase import create_client

router = APIRouter(prefix="/auth", tags=["Auth"])
settings = get_settings()


class LoginRequest(BaseModel):
    email: str
    password: str


class SignupRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    user_id: str
    email: str


@router.post("/login", response_model=AuthResponse)
async def login(data: LoginRequest):
    try:
        supabase = create_client(settings.supabase_url, settings.supabase_anon_key)
        response = supabase.auth.sign_in_with_password({
            "email": data.email,
            "password": data.password,
        })
        return AuthResponse(
            access_token=response.session.access_token,
            refresh_token=response.session.refresh_token,
            user_id=response.user.id,
            email=response.user.email,
        )
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Login failed: {str(e)}")


@router.post("/signup", response_model=AuthResponse)
async def signup(data: SignupRequest):
    try:
        supabase = create_client(settings.supabase_url, settings.supabase_anon_key)
        response = supabase.auth.sign_up({
            "email": data.email,
            "password": data.password,
        })
        if not response.session:
            raise HTTPException(
                status_code=200,
                detail="Signup successful. Please check your email to confirm.",
            )
        return AuthResponse(
            access_token=response.session.access_token,
            refresh_token=response.session.refresh_token,
            user_id=response.user.id,
            email=response.user.email,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Signup failed: {str(e)}")
