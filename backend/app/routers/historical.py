from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import SensorReading
from ..runtime_settings import get_runtime_settings
from ..schemas import HistoricalRecordOut, HistoricalSummaryPointOut
from ..seed import is_cleaning_active, mock_voltage_from_reading

router = APIRouter(prefix="/historical", tags=["historical"])


def _range_to_hours(range_value: str) -> int:
    if range_value == "week":
        return 7 * 24
    if range_value == "month":
        return 30 * 24
    return 30 * 24


def _to_record(item: SensorReading, event_type: str) -> HistoricalRecordOut:
    app_settings = get_runtime_settings()
    voltage = mock_voltage_from_reading(
        dust=float(item.dust_percent),
        temp=float(item.temperature_c),
        humidity=float(item.humidity_percent),
        timestamp=item.timestamp,
        cleaning_dust_threshold=app_settings.cleaning_dust_threshold,
    )
    cleaning_active = is_cleaning_active(voltage, app_settings.voltage_on_threshold)
    return HistoricalRecordOut(
        date=item.timestamp.strftime("%b %d"),
        time=item.timestamp.strftime("%I:%M %p"),
        dustPercent=float(item.dust_percent),
        temperatureC=float(item.temperature_c),
        humidityPercent=float(item.humidity_percent),
        voltageV=voltage,
        cleaningActive=cleaning_active,
        eventType=event_type,
    )


@router.get("/records", response_model=list[HistoricalRecordOut])
def get_records(
    range: str = Query("week", pattern="^(week|month|custom)$"),
    db: Session = Depends(get_db),
):
    app_settings = get_runtime_settings()
    hours = _range_to_hours(range)
    since = datetime.now() - timedelta(hours=hours)

    rows = db.scalars(
        select(SensorReading)
        .where(SensorReading.timestamp >= since)
        .order_by(SensorReading.timestamp.desc())
        .limit(96)
    ).all()

    timeline: list[HistoricalRecordOut] = []
    for row in rows:
        voltage = mock_voltage_from_reading(
            dust=float(row.dust_percent),
            temp=float(row.temperature_c),
            humidity=float(row.humidity_percent),
            timestamp=row.timestamp,
            cleaning_dust_threshold=app_settings.cleaning_dust_threshold,
        )
        event_type = (
            "Cleaning active"
            if is_cleaning_active(voltage, app_settings.voltage_on_threshold)
            else "Monitoring"
        )
        timeline.append(_to_record(row, event_type))
    return timeline


@router.get("/timeline", response_model=list[HistoricalRecordOut])
def get_timeline(
    range: str = Query("week", pattern="^(week|month|custom)$"),
    db: Session = Depends(get_db),
):
    app_settings = get_runtime_settings()
    hours = _range_to_hours(range)
    since = datetime.now() - timedelta(hours=hours)

    readings = db.scalars(
        select(SensorReading)
        .where(SensorReading.timestamp >= since)
        .order_by(SensorReading.timestamp.desc())
        .limit(48)
    ).all()

    timeline: list[HistoricalRecordOut] = []
    for reading in readings:
        voltage = mock_voltage_from_reading(
            dust=float(reading.dust_percent),
            temp=float(reading.temperature_c),
            humidity=float(reading.humidity_percent),
            timestamp=reading.timestamp,
            cleaning_dust_threshold=app_settings.cleaning_dust_threshold,
        )
        event_type = (
            "Cleaning active"
            if is_cleaning_active(voltage, app_settings.voltage_on_threshold)
            else "Monitoring"
        )
        timeline.append(_to_record(reading, event_type))

    return timeline


@router.get("/summary", response_model=list[HistoricalSummaryPointOut])
def get_summary(
    range: str = Query("week", pattern="^(week|month|custom)$"),
    db: Session = Depends(get_db),
):
    app_settings = get_runtime_settings()
    hours = _range_to_hours(range)
    since = datetime.now() - timedelta(hours=hours)

    rows = db.scalars(
        select(SensorReading)
        .where(SensorReading.timestamp >= since)
        .order_by(SensorReading.timestamp.asc())
    ).all()

    grouped: dict[str, dict[str, float | int]] = {}
    for row in rows:
        key = row.timestamp.strftime("%b %d")
        if key not in grouped:
            grouped[key] = {
                "dust_sum": 0.0,
                "humidity_sum": 0.0,
                "count": 0,
                "cleaning_count": 0,
            }

        voltage = mock_voltage_from_reading(
            dust=float(row.dust_percent),
            temp=float(row.temperature_c),
            humidity=float(row.humidity_percent),
            timestamp=row.timestamp,
            cleaning_dust_threshold=app_settings.cleaning_dust_threshold,
        )
        cleaning_active = is_cleaning_active(voltage, app_settings.voltage_on_threshold)

        grouped[key]["dust_sum"] += float(row.dust_percent)
        grouped[key]["humidity_sum"] += float(row.humidity_percent)
        grouped[key]["count"] += 1
        if cleaning_active:
            grouped[key]["cleaning_count"] += 1

    points: list[HistoricalSummaryPointOut] = []
    for label, values in grouped.items():
        count = int(values["count"]) or 1
        points.append(
            HistoricalSummaryPointOut(
                label=label,
                avgDustPercent=round(float(values["dust_sum"]) / count, 2),
                avgHumidityPercent=round(float(values["humidity_sum"]) / count, 2),
                cleaningActiveCount=int(values["cleaning_count"]),
            )
        )

    return points
