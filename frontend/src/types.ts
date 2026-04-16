export type DashboardMetrics = {
  dustPercent: number;
  temperatureC: number;
  humidityPercent: number;
  voltageV: number;
  cleaningActive: boolean;
  statusDust: "Low" | "Moderate" | "High";
  statusTemperature: "Cool" | "Normal" | "High";
  statusHumidity: "Dry" | "Normal" | "Humid";
  statusCleaning: "Active" | "Inactive";
  lastUpdated: string;
};

export type TrendPoint = {
  timestamp: string;
  dustPercent: number;
  temperatureC: number;
  humidityPercent: number;
  voltageV: number;
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
  date: string;
  time: string;
  dustPercent: number;
  temperatureC: number;
  humidityPercent: number;
  voltageV: number;
  cleaningActive: boolean;
  eventType: "Monitoring" | "Cleaning active";
};

export type HistoricalSummaryPoint = {
  label: string;
  avgDustPercent: number;
  avgHumidityPercent: number;
  cleaningActiveCount: number;
};

export type RuntimeSettings = {
  cleaningDustThreshold: number;
  voltageOnThreshold: number;
  insightCooldownSeconds: number;
  insightDailyCap: number;
  dashboardRefreshSeconds: number;
};
