from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import SensorReading
from ..runtime_settings import get_runtime_settings
from ..seed import is_cleaning_active, mock_voltage_from_reading
from ..services.insights import generate_insights_from_openai

router = APIRouter(prefix="/insights", tags=["insights"])
_last_insight_request_by_ip: dict[str, datetime] = {}
_insight_request_history_by_ip: dict[str, list[datetime]] = {}


@router.post("/generate")
def generate_insights(request: Request, db: Session = Depends(get_db)):
    app_settings = get_runtime_settings()
    client_ip = request.client.host if request.client else "unknown"
    now = datetime.now()

    last_request = _last_insight_request_by_ip.get(client_ip)
    if last_request is not None:
        elapsed = (now - last_request).total_seconds()
        if elapsed < app_settings.insight_cooldown_seconds:
            retry_after = int(app_settings.insight_cooldown_seconds - elapsed)
            raise HTTPException(
                status_code=429,
                detail={
                    "message": f"Insight generation is limited to once every {app_settings.insight_cooldown_seconds} seconds.",
                    "retryAfterSeconds": max(1, retry_after),
                },
            )

    day_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    history = _insight_request_history_by_ip.get(client_ip, [])
    history = [ts for ts in history if ts >= day_start]
    if len(history) >= app_settings.insight_daily_cap:
        raise HTTPException(
            status_code=429,
            detail={
                "message": "Daily insight generation cap reached.",
                "retryAfterSeconds": int((day_start + timedelta(days=1) - now).total_seconds()),
            },
        )

    _last_insight_request_by_ip[client_ip] = now
    history.append(now)
    _insight_request_history_by_ip[client_ip] = history

    readings = db.scalars(
        select(SensorReading)
        .where(SensorReading.timestamp >= now - timedelta(hours=2))
        .order_by(SensorReading.timestamp.asc())
    ).all()

    latest = readings[-1] if readings else None
    latest_voltage = (
        mock_voltage_from_reading(
            dust=float(latest.dust_percent),
            temp=float(latest.temperature_c),
            humidity=float(latest.humidity_percent),
            timestamp=latest.timestamp,
            cleaning_dust_threshold=app_settings.cleaning_dust_threshold,
        )
        if latest
        else 0.0
    )

    events_count = 0
    readings_24h = db.scalars(
        select(SensorReading)
        .where(SensorReading.timestamp >= now - timedelta(hours=24))
        .order_by(SensorReading.timestamp.asc())
    ).all()
    for row in readings_24h:
        voltage = mock_voltage_from_reading(
            dust=float(row.dust_percent),
            temp=float(row.temperature_c),
            humidity=float(row.humidity_percent),
            timestamp=row.timestamp,
            cleaning_dust_threshold=app_settings.cleaning_dust_threshold,
        )
        if is_cleaning_active(voltage, app_settings.voltage_on_threshold):
            events_count += 1

    context = {
        "latest": {
            "dust_percent": float(latest.dust_percent) if latest else None,
            "temperature_c": float(latest.temperature_c) if latest else None,
            "humidity_percent": float(latest.humidity_percent) if latest else None,
            "voltage_v": latest_voltage if latest else None,
            "cleaning_active": is_cleaning_active(latest_voltage, app_settings.voltage_on_threshold)
            if latest
            else None,
            "timestamp": latest.timestamp.isoformat() if latest else None,
        },
        "recent_trends": [
            {
                "timestamp": row.timestamp.isoformat(),
                "dust_percent": float(row.dust_percent),
                "temperature_c": float(row.temperature_c),
                "humidity_percent": float(row.humidity_percent),
                "voltage_v": mock_voltage_from_reading(
                    dust=float(row.dust_percent),
                    temp=float(row.temperature_c),
                    humidity=float(row.humidity_percent),
                    timestamp=row.timestamp,
                    cleaning_dust_threshold=app_settings.cleaning_dust_threshold,
                ),
            }
            for row in readings
        ],
        "triggered_events_last_24h": int(events_count),
    }

    return generate_insights_from_openai(context)
