from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import SensorReading
from ..schemas import DashboardMetricsOut, TrendPointOut, TriggerEventOut
from ..seed import status_dust, status_humidity, status_solar_power, status_temp

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/current", response_model=DashboardMetricsOut)
def get_current_metrics(db: Session = Depends(get_db)):
    latest = db.scalar(select(SensorReading).order_by(SensorReading.timestamp.desc()).limit(1))

    if latest is None:
        return DashboardMetricsOut(
            dustPercent=0.0,
            reflectivityRawAvg=0.0,
            temperatureC=0.0,
            humidityPercent=0.0,
            solarPowerMw=0.0,
            cleaningActive=False,
            statusDust="Low",
            statusTemperature="Cool",
            statusHumidity="Dry",
            statusSolar="Low",
            statusCleaning="Inactive",
            lastUpdated=datetime.now(),
        )

    dust = float(latest.dust_percent)
    reflectivity = float(latest.reflectivity_raw_avg)
    temp = float(latest.temperature_c)
    humidity = float(latest.humidity_percent)
    solar_power = float(latest.solar_power_mw)
    cleaning_active = bool(latest.cleaning_active)

    return DashboardMetricsOut(
        dustPercent=dust,
        reflectivityRawAvg=reflectivity,
        temperatureC=temp,
        humidityPercent=humidity,
        solarPowerMw=solar_power,
        cleaningActive=cleaning_active,
        statusDust=status_dust(dust),
        statusTemperature=status_temp(temp),
        statusHumidity=status_humidity(humidity),
        statusSolar=status_solar_power(solar_power),
        statusCleaning="Active" if cleaning_active else "Inactive",
        lastUpdated=latest.timestamp,
    )


@router.get("/trends", response_model=list[TrendPointOut])
def get_trends(db: Session = Depends(get_db)):
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
            reflectivityRawAvg=float(row.reflectivity_raw_avg),
            temperatureC=float(row.temperature_c),
            humidityPercent=float(row.humidity_percent),
            solarPowerMw=float(row.solar_power_mw),
            cleaningActive=bool(row.cleaning_active),
        )
        for row in rows
    ]


@router.get("/events", response_model=list[TriggerEventOut])
def get_triggered_events(db: Session = Depends(get_db)):
    now = datetime.now().replace(minute=0, second=0, microsecond=0)
    start = now - timedelta(hours=23)

    readings = db.scalars(
        select(SensorReading)
        .where(SensorReading.timestamp >= start)
        .order_by(SensorReading.timestamp.asc())
    ).all()

    counts_by_hour: dict[datetime, int] = {}
    for reading in readings:
        if not bool(reading.cleaning_active):
            continue
        hour_bucket = reading.timestamp.replace(minute=0, second=0, microsecond=0)
        counts_by_hour[hour_bucket] = counts_by_hour.get(hour_bucket, 0) + 1

    points: list[TriggerEventOut] = []
    for i in range(24):
        hour = start + timedelta(hours=i)
        points.append(TriggerEventOut(timestamp=hour, count=counts_by_hour.get(hour, 0)))

    return points
