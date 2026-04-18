from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class DashboardMetricsOut(BaseModel):
    dustPercent: float
    reflectivityRawAvg: float
    temperatureC: float
    humidityPercent: float
    solarPowerMw: float
    cleaningActive: bool
    statusDust: Literal["Low", "Moderate", "High"]
    statusTemperature: Literal["Cool", "Normal", "High"]
    statusHumidity: Literal["Dry", "Normal", "Humid"]
    statusSolar: Literal["Low", "Normal", "Strong"]
    statusCleaning: Literal["Active", "Inactive"]
    lastUpdated: datetime


class TrendPointOut(BaseModel):
    timestamp: datetime
    dustPercent: float
    reflectivityRawAvg: float
    temperatureC: float
    humidityPercent: float
    solarPowerMw: float
    cleaningActive: bool


class TriggerEventOut(BaseModel):
    timestamp: datetime
    count: int


class InsightOut(BaseModel):
    title: str
    reason: str


class HistoricalRecordOut(BaseModel):
    dateTime: str
    dustPercent: float
    temperatureC: float
    humidityPercent: float
    cleaningActive: bool
    solarPowerMw: float
    eventType: Literal["Monitoring", "Cleaning active"]


class HistoricalSummaryPointOut(BaseModel):
    label: str
    avgDustPercent: float
    avgHumidityPercent: float
    avgSolarPowerMw: float
    cleaningActiveCount: int


class RuntimeSettingsOut(BaseModel):
    cleaningDustThreshold: float
    voltageOnThreshold: float
    insightCooldownSeconds: int
    insightDailyCap: int
    dashboardRefreshSeconds: int


class RuntimeSettingsUpdateIn(BaseModel):
    cleaningDustThreshold: float
    voltageOnThreshold: float
    insightCooldownSeconds: int
    insightDailyCap: int
    dashboardRefreshSeconds: int
