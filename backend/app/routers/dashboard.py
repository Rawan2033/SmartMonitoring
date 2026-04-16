from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import SensorReading
from ..runtime_settings import get_runtime_settings
from ..schemas import DashboardMetricsOut, TrendPointOut, TriggerEventOut
from ..seed import is_cleaning_active, mock_voltage_from_reading, status_dust, status_humidity, status_temp

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/current", response_model=DashboardMetricsOut)
def get_current_metrics(db: Session = Depends(get_db)):
    app_settings = get_runtime_settings()
    latest = db.scalar(select(SensorReading).order_by(SensorReading.timestamp.desc()).limit(1))

    if latest is None:
        return DashboardMetricsOut(
            dustPercent=0.0,
            temperatureC=0.0,
            humidityPercent=0.0,
            voltageV=0.0,
            cleaningActive=False,
            statusDust="Low",
            statusTemperature="Cool",
            statusHumidity="Dry",
            statusCleaning="Inactive",
            lastUpdated=datetime.now(),
        )

    dust = float(latest.dust_percent)
    temp = float(latest.temperature_c)
    humidity = float(latest.humidity_percent)
    voltage = mock_voltage_from_reading(
        dust=dust,
        temp=temp,
        humidity=humidity,
        timestamp=latest.timestamp,
        cleaning_dust_threshold=app_settings.cleaning_dust_threshold,
    )
    cleaning_active = is_cleaning_active(voltage, app_settings.voltage_on_threshold)

    return DashboardMetricsOut(
        dustPercent=dust,
        temperatureC=temp,
        humidityPercent=humidity,
        voltageV=voltage,
        cleaningActive=cleaning_active,
        statusDust=status_dust(dust),
        statusTemperature=status_temp(temp),
        statusHumidity=status_humidity(humidity),
        statusCleaning="Active" if cleaning_active else "Inactive",
        lastUpdated=latest.timestamp,
    )


@router.get("/trends", response_model=list[TrendPointOut])
def get_trends(db: Session = Depends(get_db)):
    app_settings = get_runtime_settings()
    since = datetime.now() - timedelta(hours=2)
    rows = db.scalars(
        select(SensorReading)
        .where(SensorReading.timestamp >= since)
        .order_by(SensorReading.timestamp.asc())
    ).all()

    return [
        TrendPointOut(
            timestamp=row.timestamp,
            dustPercent=float(row.dust_percent),
            temperatureC=float(row.temperature_c),
            humidityPercent=float(row.humidity_percent),
            voltageV=mock_voltage_from_reading(
                dust=float(row.dust_percent),
                temp=float(row.temperature_c),
                humidity=float(row.humidity_percent),
                timestamp=row.timestamp,
                cleaning_dust_threshold=app_settings.cleaning_dust_threshold,
            ),
        )
        for row in rows
    ]


@router.get("/events", response_model=list[TriggerEventOut])
def get_triggered_events(db: Session = Depends(get_db)):
    app_settings = get_runtime_settings()
    now = datetime.now().replace(minute=0, second=0, microsecond=0)
    start = now - timedelta(hours=23)

    readings = db.scalars(
        select(SensorReading)
        .where(SensorReading.timestamp >= start)
        .order_by(SensorReading.timestamp.asc())
    ).all()

    counts_by_hour: dict[datetime, int] = {}
    for reading in readings:
        voltage = mock_voltage_from_reading(
            dust=float(reading.dust_percent),
            temp=float(reading.temperature_c),
            humidity=float(reading.humidity_percent),
            timestamp=reading.timestamp,
            cleaning_dust_threshold=app_settings.cleaning_dust_threshold,
        )
        if not is_cleaning_active(voltage, app_settings.voltage_on_threshold):
            continue
        hour_bucket = reading.timestamp.replace(minute=0, second=0, microsecond=0)
        counts_by_hour[hour_bucket] = counts_by_hour.get(hour_bucket, 0) + 1

    points: list[TriggerEventOut] = []
    for i in range(24):
        hour = start + timedelta(hours=i)
        points.append(TriggerEventOut(timestamp=hour, count=counts_by_hour.get(hour, 0)))

    return points
