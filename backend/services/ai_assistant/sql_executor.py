"""
SQL Executor

Executes validated SELECT queries against the SQLite database
using the existing SQLAlchemy session infrastructure.

Design:
  - Reuses SessionLocal from database.session (no new connections)
  - Returns serializable Python primitives (no ORM objects)
  - Caps results at MAX_ROWS to avoid memory issues
  - Compatible with SQLite today; PostgreSQL-ready by design
    (just update DATABASE_URL in .env)
"""

from typing import Any, Dict, List, Tuple

from sqlalchemy import text

from database.session import SessionLocal
from utils.logger import get_logger

logger = get_logger(__name__)

MAX_ROWS = 200


def execute_sql(sql: str) -> Tuple[List[str], List[List[Any]]]:
    """
    Execute a validated SELECT SQL query and return columns + rows.

    Args:
        sql: A validated, safe SELECT query string.

    Returns:
        Tuple of (columns: list[str], rows: list[list[Any]]).

    Raises:
        RuntimeError: On database errors, with a cleaned message.
    """
    db = SessionLocal()
    try:
        logger.info("AI Assistant executing SQL: %s", sql[:200])
        result = db.execute(text(sql))

        columns: List[str] = list(result.keys())
        raw_rows = result.fetchmany(MAX_ROWS)

        # Convert Row objects to plain Python lists for JSON serialization
        rows: List[List[Any]] = []
        for row in raw_rows:
            serialized = []
            for value in row:
                # Convert non-JSON-serializable types to string
                if isinstance(value, (int, float, str, bool, type(None))):
                    serialized.append(value)
                else:
                    serialized.append(str(value))
            rows.append(serialized)

        logger.info(
            "AI Assistant query returned %d rows, %d columns",
            len(rows), len(columns)
        )
        return columns, rows

    except Exception as exc:
        # Clean up SQLAlchemy error messages for user-facing display
        error_msg = str(exc)
        # Strip internal stack noise
        if ")" in error_msg:
            error_msg = error_msg.split(")")[-1].strip() or error_msg
        logger.error("AI Assistant SQL execution error: %s", error_msg)
        raise RuntimeError(f"Database query failed: {error_msg}") from exc

    finally:
        db.close()


def get_schema_info() -> Dict[str, List[Dict[str, str]]]:
    """
    Retrieve the database schema (table names and columns with types).
    Used to build Gemini's context prompt.

    Returns:
        Dict mapping table_name → list of {name, type} dicts.
    """
    db = SessionLocal()
    try:
        # SQLite-specific: get all user tables
        tables_result = db.execute(
            text("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
        )
        table_names = [row[0] for row in tables_result.fetchall()]

        schema: Dict[str, List[Dict[str, str]]] = {}
        for table in table_names:
            if table.startswith("_"):  # skip internal tables
                continue
            cols_result = db.execute(text(f"PRAGMA table_info({table});"))
            columns = [
                {"name": row[1], "type": row[2]}
                for row in cols_result.fetchall()
            ]
            schema[table] = columns

        return schema

    except Exception as exc:
        logger.error("Failed to retrieve schema: %s", exc)
        return {}

    finally:
        db.close()
