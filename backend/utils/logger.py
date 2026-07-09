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
    Return a configured logger instance with console and rotating file output.

    Args:
        name: Usually __name__ of the calling module.

    Returns:
        logging.Logger instance with handlers.
    """
    import os
    from logging.handlers import RotatingFileHandler

    settings = get_settings()
    level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    logger = logging.getLogger(name)

    # Avoid adding duplicate handlers if logger already configured
    if not logger.handlers:
        logger.setLevel(level)

        # Common log message formatter
        formatter = logging.Formatter(
            fmt="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )

        # 1. Console Stream Handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(level)
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)

        # 2. Rotating File Handler (backend/logs.txt)
        try:
            utils_dir = os.path.dirname(os.path.abspath(__file__))
            backend_dir = os.path.dirname(utils_dir)
            log_file = os.path.join(backend_dir, "logs.txt")

            file_handler = RotatingFileHandler(
                log_file,
                maxBytes=5 * 1024 * 1024,  # 5 Megabytes
                backupCount=3,              # Keep up to 3 rotated files
                encoding="utf-8"
            )
            file_handler.setLevel(level)
            file_handler.setFormatter(formatter)
            logger.addHandler(file_handler)
        except Exception as exc:
            # Fallback print if file logging cannot start due to permissions
            print(f"Warning: Failed to initialize file logging: {exc}", file=sys.stderr)

    return logger
