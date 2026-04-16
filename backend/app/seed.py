from datetime import datetime, timedelta
import random

def generate_readings(hours: int = 48):
    now = datetime.now().replace(second=0, microsecond=0)
    readings = []
    for i in range(hours * 12):
        t = now - timedelta(minutes=5 * i)
        readings.append(
            {
                "timestamp": t,
                "dustPercent": round(random.uniform(22, 60), 1),
                "temperatureC": round(random.uniform(24, 36), 1),
                "humidityPercent": round(random.uniform(38, 60), 1),
            }
        )
    return list(reversed(readings))


def generate_trigger_counts(hours: int = 24):
    now = datetime.now().replace(minute=0, second=0, microsecond=0)
    points = []
    for i in range(hours):
        t = now - timedelta(hours=hours - i)
        count = 0
        if t.hour in (3, 8, 14, 16, 18, 21, 22):
            count = random.randint(1, 4)
        points.append({"timestamp": t, "count": count})
    return points


def status_dust(dust: float) -> str:
    if dust < 25:
        return "Low"
    if dust < 45:
        return "Moderate"
    return "High"


def status_temp(temp: float) -> str:
    if temp < 20:
        return "Cool"
    if temp < 34:
        return "Normal"
    return "High"


def status_humidity(humidity: float) -> str:
    if humidity < 30:
        return "Dry"
    if humidity < 55:
        return "Normal"
    return "Humid"


def mock_voltage_from_reading(
    dust: float,
    temp: float,
    humidity: float,
    timestamp: datetime,
    cleaning_dust_threshold: float = 35.0,
) -> float:
    # Deterministic mock signal based on reading + time slot (no ESP required).
    slot = (timestamp.hour * 12) + (timestamp.minute // 5)
    cycle_on = (slot % 9) in (0, 1, 2)
    daytime = 8 <= timestamp.hour <= 18

    if not (cycle_on and daytime and dust >= cleaning_dust_threshold):
        return 0.0

    # kV-style mock values for EDS: nominal 1.0 kV +/-10%, abs max 1.2 kV.
    base = (
        0.92
        + max(0.0, (dust - cleaning_dust_threshold) * 0.008)
        + max(0.0, (temp - 26) * 0.003)
        - max(0.0, (humidity - 55) * 0.002)
    )
    jitter = ((slot % 7) * 0.01)
    return round(max(0.0, min(1.2, base + jitter)), 2)


def is_cleaning_active(voltage_v: float, voltage_on_threshold: float = 2.0) -> bool:
    return voltage_v >= voltage_on_threshold
