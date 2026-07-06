"""
Centralized Logging Configuration

Provides a project-wide logger that:
    - Supports log levels from configuration (LOG_LEVEL env var)
    - Outputs structured log messages with timestamps
    - Replaces all print() statements in the codebase

Usage:
    from utils.logger import get_logger

    logger = get_logger(__name__)
    logger.info("Workflow started for order %s", order_id)
    logger.error("Failed to process order", exc_info=True)

Log Level Hierarchy:
    DEBUG < INFO < WARNING < ERROR < CRITICAL

TODO:
    - Add file rotation handler for production logging to files
    - Add structured JSON logging for log aggregation tools (DataDog, ELK)
    - Add request-ID correlation for distributed tracing
"""

import logging
import sys

from config import get_settings


def get_logger(name: str = __name__) -> logging.Logger:
    """
    Return a configured logger instance.

    Args:
        name: Usually __name__ of the calling module.

    Returns:
        logging.Logger instance with console handler.
    """
    settings = get_settings()
    level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    logger = logging.getLogger(name)

    # Avoid adding duplicate handlers if logger already configured
    if not logger.handlers:
        logger.setLevel(level)

        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(level)

        formatter = logging.Formatter(
            fmt="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        handler.setFormatter(formatter)

        logger.addHandler(handler)

    return logger
