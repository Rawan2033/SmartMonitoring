export type DashboardMetrics = {
  dustPercent: number;
  reflectivityRawAvg: number;
  temperatureC: number;
  humidityPercent: number;
  solarPowerMw: number;
  cleaningActive: boolean;
  statusDust: "Low" | "Moderate" | "High";
  statusTemperature: "Cool" | "Normal" | "High";
  statusHumidity: "Dry" | "Normal" | "Humid";
  statusSolar: "Low" | "Normal" | "Strong";
  statusCleaning: "Active" | "Inactive";
  lastUpdated: string;
};

export type TrendPoint = {
  timestamp: string;
  dustPercent: number;
  reflectivityRawAvg: number;
  temperatureC: number;
  humidityPercent: number;
  solarPowerMw: number;
  cleaningActive: boolean;
};

export type TriggerEvent = {
  timestamp: string;
  count: number;
};

export type Insight = {
  title: string;
  reason: string;
};

export type HistoricalRecord = {
  dateTime: string;
  dustPercent: number;
  temperatureC: number;
  humidityPercent: number;
  cleaningActive: boolean;
  solarPowerMw: number;
  eventType: "Monitoring" | "Cleaning active";
};

export type HistoricalSummaryPoint = {
  label: string;
  avgDustPercent: number;
  avgHumidityPercent: number;
  avgSolarPowerMw: number;
  cleaningActiveCount: number;
};

export type RuntimeSettings = {
  cleaningDustThreshold: number;
  voltageOnThreshold: number;
  insightCooldownSeconds: number;
  insightDailyCap: number;
  dashboardRefreshSeconds: number;
};
