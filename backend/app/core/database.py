from supabase import create_async_client, AsyncClient
from app.core.config import get_settings

settings = get_settings()

_supabase_client: AsyncClient | None = None

async def get_supabase() -> AsyncClient:
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = await create_async_client(
            settings.supabase_url,
            settings.supabase_anon_key
        )
    return _supabase_client
