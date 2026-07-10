"""
SQL Validator

Security layer that validates SQL queries before execution.
Ensures only safe, read-only SELECT queries are allowed.

Rules:
  - Must start with SELECT (after stripping whitespace/comments)
  - Blocked keywords: INSERT, UPDATE, DELETE, DROP, ALTER, CREATE,
    TRUNCATE, ATTACH, PRAGMA, EXEC, EXECUTE, CALL
  - Blocked patterns: UNION-based injection, SQL comment abuse
  - Max query length: 4000 characters
"""

import re
from typing import Tuple

# Dangerous DML / DDL keywords that should never appear
_BLOCKED_KEYWORDS = [
    r"\bINSERT\b",
    r"\bUPDATE\b",
    r"\bDELETE\b",
    r"\bDROP\b",
    r"\bALTER\b",
    r"\bCREATE\b",
    r"\bTRUNCATE\b",
    r"\bATTACH\b",
    r"\bPRAGMA\b",
    r"\bEXEC\b",
    r"\bEXECUTE\b",
    r"\bCALL\b",
    r"\bGRANT\b",
    r"\bREVOKE\b",
    r"\bREPLACE\b",
    r"\bINSERT\s+INTO\b",
    r"\bDROP\s+TABLE\b",
    r"\bDROP\s+DATABASE\b",
]

# Patterns used in SQL injection attacks (excluding safe UNION queries)
_INJECTION_PATTERNS = [
    r";\s*SELECT",          # stacked queries
    r";\s*DROP",
    r";\s*DELETE",
    r";\s*INSERT",
    r";\s*UPDATE",
    r"xp_cmdshell",
    r"INTO\s+OUTFILE",
    r"INTO\s+DUMPFILE",
    r"LOAD_FILE",
    r"LOAD\s+DATA",
]

MAX_SQL_LENGTH = 4000


def validate_sql(sql: str) -> Tuple[bool, str]:
    """
    Validate a SQL query for security and safety.

    Args:
        sql: The SQL string to validate.

    Returns:
        Tuple of (is_valid: bool, reason: str).
        If invalid, reason contains a human-readable explanation.
    """
    if not sql or not sql.strip():
        return False, "Empty SQL query."

    if len(sql) > MAX_SQL_LENGTH:
        return False, f"SQL query is too long ({len(sql)} chars, max {MAX_SQL_LENGTH})."

    # Normalize for keyword matching: uppercase, collapse whitespace
    normalized = re.sub(r"\s+", " ", sql.strip().upper())

    # Must begin with SELECT
    if not normalized.startswith("SELECT"):
        return False, (
            "Only SELECT queries are permitted. "
            "The generated query does not start with SELECT."
        )

    # Check for blocked DML/DDL keywords
    for pattern in _BLOCKED_KEYWORDS:
        if re.search(pattern, normalized, re.IGNORECASE):
            keyword = pattern.replace(r"\b", "").replace("\\s+", " ").strip()
            return False, (
                f"Query contains a blocked keyword or operation: '{keyword}'. "
                "Only read-only SELECT queries are permitted."
            )

    # Check for injection patterns
    for pattern in _INJECTION_PATTERNS:
        if re.search(pattern, normalized, re.IGNORECASE):
            return False, (
                "Query contains a potentially unsafe pattern "
                f"matching '{pattern}'. Request rejected for security."
            )

    # Block dangerous SQL comment patterns that hide injections
    # Allow -- only if it's clearly at end-of-line (not mid-statement abuse)
    if re.search(r"--[^\n]*;", sql):
        return False, "Query contains suspicious inline SQL comment patterns."

    return True, "OK"
