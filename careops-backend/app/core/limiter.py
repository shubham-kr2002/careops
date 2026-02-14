from slowapi import Limiter
from slowapi.util import get_remote_address
from app.config import settings

# Create limiter instance
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[settings.RATE_LIMIT_GENERAL]
)