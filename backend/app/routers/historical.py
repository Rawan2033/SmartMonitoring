from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import SensorReading
from ..schemas import HistoricalRecordOut, HistoricalSummaryPointOut

router = APIRouter(prefix="/historical", tags=["historical"])


def _range_to_hours(range_value: str) -> int:
    if range_value == "week":
        return 7 * 24
    if range_value == "month":
        return 30 * 24
    return 30 * 24


def _to_record(item: SensorReading, event_type: str) -> HistoricalRecordOut:
    return HistoricalRecordOut(
        dateTime=item.timestamp.strftime("%Y-%m-%d %I:%M %p"),
        dustPercent=float(item.dust_percent),
        temperatureC=float(item.temperature_c),
        humidityPercent=float(item.humidity_percent),
        cleaningActive=bool(item.cleaning_active),
        solarPowerMw=float(item.solar_power_mw),
        eventType=event_type,
    )


@router.get("/records", response_model=list[HistoricalRecordOut])
def get_records(
    range: str = Query("week", pattern="^(week|month|custom)$"),
    db: Session = Depends(get_db),
):
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
        event_type = (
            "Cleaning active"
            if bool(row.cleaning_active)
            else "Monitoring"
        )
        timeline.append(_to_record(row, event_type))
    return timeline


@router.get("/timeline", response_model=list[HistoricalRecordOut])
def get_timeline(
    range: str = Query("week", pattern="^(week|month|custom)$"),
    db: Session = Depends(get_db),
):
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
        event_type = (
            "Cleaning active"
            if bool(reading.cleaning_active)
            else "Monitoring"
        )
        timeline.append(_to_record(reading, event_type))

    return timeline


@router.get("/summary", response_model=list[HistoricalSummaryPointOut])
def get_summary(
    range: str = Query("week", pattern="^(week|month|custom)$"),
    db: Session = Depends(get_db),
):
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
                "solar_sum": 0.0,
                "count": 0,
                "cleaning_count": 0,
            }

        grouped[key]["dust_sum"] += float(row.dust_percent)
        grouped[key]["humidity_sum"] += float(row.humidity_percent)
        grouped[key]["solar_sum"] += float(row.solar_power_mw)
        grouped[key]["count"] += 1
        if bool(row.cleaning_active):
            grouped[key]["cleaning_count"] += 1

    points: list[HistoricalSummaryPointOut] = []
    for label, values in grouped.items():
        count = int(values["count"]) or 1
        points.append(
            HistoricalSummaryPointOut(
                label=label,
                avgDustPercent=round(float(values["dust_sum"]) / count, 2),
                avgHumidityPercent=round(float(values["humidity_sum"]) / count, 2),
                avgSolarPowerMw=round(float(values["solar_sum"]) / count, 2),
                cleaningActiveCount=int(values["cleaning_count"]),
            )
        )

    return points
