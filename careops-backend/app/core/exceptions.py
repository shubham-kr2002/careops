import logging
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

logger = logging.getLogger("careops")


class CareOpsException(Exception):
    """Base exception for CareOps application."""
    def __init__(
        self, 
        message: str, 
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR, 
        code: str = "INTERNAL_ERROR"
    ):
        self.message = message
        self.status_code = status_code
        self.code = code
        super().__init__(self.message)


class AuthenticationError(CareOpsException):
    """Authentication related errors."""
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message, status.HTTP_401_UNAUTHORIZED, "AUTHENTICATION_ERROR")


class AuthorizationError(CareOpsException):
    """Authorization related errors."""
    def __init__(self, message: str = "Not authorized"):
        super().__init__(message, status.HTTP_403_FORBIDDEN, "AUTHORIZATION_ERROR")


class ValidationError(CareOpsException):
    """Validation related errors."""
    def __init__(self, message: str = "Validation failed"):
        super().__init__(message, status.HTTP_400_BAD_REQUEST, "VALIDATION_ERROR")


class NotFoundError(CareOpsException):
    """Resource not found errors."""
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, status.HTTP_404_NOT_FOUND, "NOT_FOUND")


def setup_exception_handlers(app: FastAPI):
    """Setup exception handlers for the FastAPI application."""
    
    @app.exception_handler(CareOpsException)
    async def careops_exception_handler(request: Request, exc: CareOpsException):
        logger.warning(f"CareOpsException: {exc.code} - {exc.message}")
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": {
                    "code": exc.code,
                    "message": exc.message
                }
            }
        )
    
    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled exception: {exc}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "An unexpected error occurred. Please try again later."
                }
            }
        )