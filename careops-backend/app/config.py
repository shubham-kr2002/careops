import os
import secrets
from pydantic_settings import BaseSettings
from functools import lru_cache


def get_secure_secret() -> str:
    """Get secure secret from environment or raise error."""
    secret = os.getenv("SECRET_KEY")
    if not secret:
        raise ValueError(
            "FATAL: SECRET_KEY environment variable must be set!\n"
            "Generate one with: python -c \"import secrets; print(secrets.token_urlsafe(32))\"\n"
            "Then set it in your .env file or environment variables."
        )
    return secret


def get_jwt_secret() -> str:
    """Get JWT secret from environment or raise error."""
    secret = os.getenv("JWT_SECRET_KEY")
    if not secret:
        raise ValueError(
            "FATAL: JWT_SECRET_KEY environment variable must be set!\n"
            "Generate one with: python -c \"import secrets; print(secrets.token_urlsafe(32))\"\n"
            "Then set it in your .env file or environment variables."
        )
    return secret


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    # Application
    APP_NAME: str = "CareOps API"
    APP_ENV: str = "development"
    DEBUG: bool = True
    
    # Secrets - MUST be set in environment
    SECRET_KEY: str = ""
    JWT_SECRET_KEY: str = ""
    
    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/careops"
    
    # JWT
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24
    JWT_REFRESH_EXPIRATION_DAYS: int = 30
    
    # CORS
    FRONTEND_URL: str = "http://localhost:3000"
    ALLOWED_ORIGINS: list = ["http://localhost:3000", "http://localhost:3001"]
    
    # Rate Limiting
    RATE_LIMIT_LOGIN: str = "5/minute"
    RATE_LIMIT_REGISTER: str = "3/minute"
    RATE_LIMIT_GENERAL: str = "100/minute"
    
    # Email Provider (sendgrid or gmail)
    EMAIL_PROVIDER: str = "sendgrid"
    
    # SendGrid
    SENDGRID_API_KEY: str = ""
    SENDGRID_FROM_EMAIL: str = "noreply@careops.io"
    
    # Gmail API
    GMAIL_CLIENT_ID: str = ""
    GMAIL_CLIENT_SECRET: str = ""
    GMAIL_REDIRECT_URI: str = "http://localhost:8000/api/v1/integrations/gmail/callback"
    GMAIL_EMAIL: str = ""
    
    # Groq AI
    GROQ_API_KEY: str = ""
    
    # WhatsApp Business API
    WHATSAPP_API_URL: str = "https://graph.facebook.com/v18.0"
    WHATSAPP_PHONE_NUMBER_ID: str = ""
    WHATSAPP_ACCESS_TOKEN: str = ""
    WHATSAPP_VERIFY_TOKEN: str = "careops-webhook-verify-token"
    
    # Slack Integration
    SLACK_CLIENT_ID: str = ""
    SLACK_CLIENT_SECRET: str = ""
    SLACK_SIGNING_SECRET: str = ""
    SLACK_BOT_TOKEN: str = ""
    
    class Config:
        env_file = ".env"
        case_sensitive = True
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Validate secrets are set (allow dev defaults for Docker compose)
        if not self.SECRET_KEY:
            raise ValueError(
                "SECRET_KEY must be set in environment variables.\n"
                "Generate one with: python -c \"import secrets; print(secrets.token_urlsafe(32))\""
            )
        if not self.JWT_SECRET_KEY:
            raise ValueError(
                "JWT_SECRET_KEY must be set in environment variables.\n"
                "Generate one with: python -c \"import secrets; print(secrets.token_urlsafe(32))\""
            )


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
