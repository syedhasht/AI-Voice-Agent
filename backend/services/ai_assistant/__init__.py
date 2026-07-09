"""
AI Assistant Services Package

Provides Natural Language → SQL → Insight pipeline for the Enterprise AI Assistant.

Submodules:
    sql_generator       — Converts user question to SQL via Gemini
    sql_validator       — Security whitelist validation before execution
    sql_executor        — Runs validated SQL on SQLite via SQLAlchemy
    explanation_service — Generates business insight summary via Gemini
    chart_selector      — Auto-selects best chart type for result data
    ai_assistant_service — Main orchestrator
"""
