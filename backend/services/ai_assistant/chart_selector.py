"""
Chart Selector

Automatically selects the best chart type and extracts chart data
from SQL query results based on column names and data shape.

Supported chart types:
  - bar   — comparisons between categories (default for most queries)
  - line  — time-series data (date/hour columns detected)
  - pie   — distribution/proportion data (2 cols: label + value, ≤ 12 rows)
  - none  — no chart (too many columns, no numeric data, or single row)

Returns:
  {
    "type": "bar" | "line" | "pie" | "none",
    "x_key": str,       # key for X-axis / label
    "y_key": str,       # key for Y-axis / value
    "data": list[dict]  # [{x_key: val, y_key: val}, ...]
  }
"""

import re
from typing import Any, Dict, List, Optional


# Column name patterns that suggest time-series data → line chart
_TIME_PATTERNS = [
    r"\bdate\b", r"\bday\b", r"\bmonth\b", r"\byear\b",
    r"\bhour\b", r"\bweek\b", r"\bperiod\b", r"\btimestamp\b",
    r"created_at", r"started_at", r"ended_at",
]

# Column name patterns that suggest numeric value columns
_VALUE_PATTERNS = [
    r"\bcount\b", r"\btotal\b", r"\bsum\b", r"\bavg\b",
    r"\brevenue\b", r"\bamount\b", r"\brate\b", r"\bprice\b",
    r"\bquantity\b", r"\bduration\b", r"\bpercent\b",
    r"\bvalue\b", r"\bscore\b", r"\bconfidence\b",
]


def _is_time_column(col: str) -> bool:
    col_lower = col.lower()
    return any(re.search(p, col_lower) for p in _TIME_PATTERNS)


def _is_value_column(col: str) -> bool:
    col_lower = col.lower()
    return any(re.search(p, col_lower) for p in _VALUE_PATTERNS)


def _is_numeric(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def _find_best_columns(
    columns: List[str], rows: List[List[Any]]
) -> Optional[Dict[str, str]]:
    """
    Find the best x_key (label) and y_key (value) columns.

    Returns dict with x_key and y_key, or None if no good match found.
    """
    if not columns or not rows:
        return None

    # Detect which columns contain numeric values
    numeric_cols = []
    text_cols = []
    time_cols = []

    for i, col in enumerate(columns):
        if _is_time_column(col):
            time_cols.append(col)
        else:
            # Check actual data values
            sample_vals = [row[i] for row in rows[:10] if i < len(row)]
            numeric_count = sum(1 for v in sample_vals if _is_numeric(v))
            if numeric_count >= len(sample_vals) * 0.5:
                numeric_cols.append(col)
            else:
                text_cols.append(col)

    if not numeric_cols:
        return None

    # Prefer: time col → x, first value col → y
    # If no time col: first text col → x, first numeric → y
    x_key = (time_cols[0] if time_cols else
              text_cols[0] if text_cols else
              columns[0])
    y_key = numeric_cols[0]

    # Don't use the same column for both
    if x_key == y_key:
        remaining = [c for c in columns if c != x_key]
        if not remaining:
            return None
        y_key = remaining[0]

    return {"x_key": x_key, "y_key": y_key, "has_time": bool(time_cols)}


def select_chart(
    columns: List[str],
    rows: List[List[Any]],
) -> Dict[str, Any]:
    """
    Auto-select the best chart type and extract chart-ready data.

    Args:
        columns: List of column name strings.
        rows: List of row data (each row is a list of values).

    Returns:
        Dict with keys: type, x_key, y_key, data.
    """
    no_chart = {"type": "none", "x_key": None, "y_key": None, "data": []}

    if not rows or not columns:
        return no_chart

    # Single row: no chart
    if len(rows) == 1:
        return no_chart

    # More than 6 columns: too complex for a chart
    if len(columns) > 6:
        return no_chart

    best = _find_best_columns(columns, rows)
    if not best:
        return no_chart

    x_key = best["x_key"]
    y_key = best["y_key"]
    has_time = best["has_time"]

    x_idx = columns.index(x_key)
    y_idx = columns.index(y_key)

    # Build chart data
    chart_data = []
    for row in rows:
        if x_idx < len(row) and y_idx < len(row):
            x_val = row[x_idx]
            y_val = row[y_idx]
            if x_val is None:
                x_val = "(null)"
            if y_val is None:
                y_val = 0
            chart_data.append({x_key: str(x_val), y_key: y_val})

    if not chart_data:
        return no_chart

    # Determine chart type
    # Pie: exactly 2 columns, ≤ 12 data points, no time column
    if len(columns) == 2 and len(chart_data) <= 12 and not has_time:
        chart_type = "pie"
    # Line: time-based x-axis
    elif has_time:
        chart_type = "line"
    # Bar: everything else
    else:
        chart_type = "bar"

    return {
        "type": chart_type,
        "x_key": x_key,
        "y_key": y_key,
        "data": chart_data,
    }
