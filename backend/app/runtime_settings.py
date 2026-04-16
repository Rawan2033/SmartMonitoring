from __future__ import annotations

import json
from pathlib import Path
from threading import Lock

from pydantic import BaseModel, Field


class RuntimeSettings(BaseModel):
    cleaning_dust_threshold: float = Field(default=35.0, ge=0, le=100)
    voltage_on_threshold: float = Field(default=0.9, ge=0, le=2)
    insight_cooldown_seconds: int = Field(default=60, ge=5, le=3600)
    insight_daily_cap: int = Field(default=30, ge=1, le=5000)
    dashboard_refresh_seconds: int = Field(default=300, ge=15, le=3600)


_SETTINGS_FILE = Path(__file__).resolve().parent.parent / ".runtime_settings.json"
_LOCK = Lock()
_CACHE: RuntimeSettings | None = None


def _read_from_disk() -> RuntimeSettings:
    if not _SETTINGS_FILE.exists():
        return RuntimeSettings()
    try:
        payload = json.loads(_SETTINGS_FILE.read_text(encoding="utf-8"))
        loaded = RuntimeSettings.model_validate(payload)
        # Migration: old mock model used low-voltage threshold (e.g., 2.0).
        # New model uses kV-style range (0.0-1.2 nominal).
        if loaded.voltage_on_threshold > 1.2:
            loaded = loaded.model_copy(update={"voltage_on_threshold": 0.9})
        return loaded
    except Exception:
        return RuntimeSettings()


def get_runtime_settings() -> RuntimeSettings:
    global _CACHE
    with _LOCK:
        if _CACHE is None:
            _CACHE = _read_from_disk()
        return _CACHE


def update_runtime_settings(values: dict) -> RuntimeSettings:
    global _CACHE
    with _LOCK:
        if _CACHE is None:
            _CACHE = _read_from_disk()
        current = _CACHE
        merged = current.model_copy(update=values)
        _SETTINGS_FILE.write_text(
            merged.model_dump_json(indent=2),
            encoding="utf-8",
        )
        _CACHE = merged
        return merged
