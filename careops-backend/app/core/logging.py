import logging
import sys
from pythonjsonlogger import jsonlogger
from app.config import settings


def setup_logging():
    """Setup structured JSON logging for production."""
    
    # Create logger
    logger = logging.getLogger("careops")
    logger.setLevel(logging.DEBUG if settings.DEBUG else logging.INFO)
    
    # Remove existing handlers
    logger.handlers = []
    
    # Create stdout handler
    logHandler = logging.StreamHandler(sys.stdout)
    
    # JSON formatter for production
    formatter = jsonlogger.JsonFormatter(
        '%(timestamp)s %(level)s %(name)s %(message)s %(pathname)s %(lineno)d',
        rename_fields={'levelname': 'level', 'asctime': 'timestamp'}
    )
    
    logHandler.setFormatter(formatter)
    logger.addHandler(logHandler)
    
    # Reduce SQLAlchemy logging noise
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    
    return logger


# Global logger instance
logger = setup_logging()