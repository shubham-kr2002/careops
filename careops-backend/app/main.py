from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.core.exceptions import setup_exception_handlers
from app.core.limiter import limiter
from app.core.logging import logger
from app.core.security_headers import SecurityHeadersMiddleware
from app.database import engine, Base
from app.routers import auth
from app.routers import workspaces, integrations, contacts, bookings, forms, inventory, conversations, public, staff, automation, ai

# Create database tables (for development)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    description="Unified Operations Platform for service businesses",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# Setup rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Setup exception handlers
setup_exception_handlers(app)

# Add security headers middleware
app.add_middleware(SecurityHeadersMiddleware)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"]
)

# Include routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(workspaces.router)
app.include_router(integrations.router)
app.include_router(contacts.router)
app.include_router(bookings.router)
app.include_router(forms.router)
app.include_router(inventory.router)
app.include_router(conversations.router)
app.include_router(public.router)
app.include_router(staff.router)
app.include_router(automation.router)
app.include_router(ai.router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "success": True,
        "message": "Welcome to CareOps API",
        "version": "1.0.0",
        "environment": settings.APP_ENV
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "success": True,
        "status": "healthy",
        "timestamp": __import__('datetime').datetime.utcnow().isoformat()
    }


if __name__ == "__main__":
    import uvicorn
    logger.info(f"Starting {settings.APP_NAME} in {settings.APP_ENV} mode")
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info" if settings.DEBUG else "warning"
    )