from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class DashboardMetricsOut(BaseModel):
    dustPercent: float
    temperatureC: float
    humidityPercent: float
    voltageV: float
    cleaningActive: bool
    statusDust: Literal["Low", "Moderate", "High"]
    statusTemperature: Literal["Cool", "Normal", "High"]
    statusHumidity: Literal["Dry", "Normal", "Humid"]
    statusCleaning: Literal["Active", "Inactive"]
    lastUpdated: datetime


class TrendPointOut(BaseModel):
    timestamp: datetime
    dustPercent: float
    temperatureC: float
    humidityPercent: float
    voltageV: float


class TriggerEventOut(BaseModel):
    timestamp: datetime
    count: int


class InsightOut(BaseModel):
    title: str
    reason: str


class HistoricalRecordOut(BaseModel):
    date: str
    time: str
    dustPercent: float
    temperatureC: float
    humidityPercent: float
    voltageV: float
    cleaningActive: bool
    eventType: Literal["Monitoring", "Cleaning active"]


class HistoricalSummaryPointOut(BaseModel):
    label: str
    avgDustPercent: float
    avgHumidityPercent: float
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
