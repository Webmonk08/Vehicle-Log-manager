from functools import lru_cache
from supabase import create_client, Client
from app.core.config import settings


@lru_cache
def get_supabase() -> Client:
    """
    Cached Supabase client. Use as a FastAPI dependency:
        db: Client = Depends(get_supabase)
    """
    if not settings.supabase_url or not settings.supabase_service_key:
        raise RuntimeError(
            "SUPABASE_URL / SUPABASE_SERVICE_KEY not set. Copy .env.example to .env and fill in."
        )
    return create_client(settings.supabase_url, settings.supabase_service_key)
