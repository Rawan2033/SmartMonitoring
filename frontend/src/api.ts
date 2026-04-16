import type {
  DashboardMetrics,
  HistoricalRecord,
  HistoricalSummaryPoint,
  Insight,
  RuntimeSettings,
  TrendPoint,
  TriggerEvent
} from "./types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const api = {
  getCurrentMetrics: () => getJson<DashboardMetrics>("/dashboard/current"),
  getTrendData: () => getJson<TrendPoint[]>("/dashboard/trends"),
  getTriggeredEvents: () => getJson<TriggerEvent[]>("/dashboard/events"),
  generateInsights: async () => {
    const response = await fetch(`${API_BASE}/insights/generate`, { method: "POST" });
    if (!response.ok) {
      const error = new Error(`Request failed: ${response.status}`) as Error & {
        status?: number;
        retryAfterSeconds?: number;
      };
      error.status = response.status;

      try {
        const payload = await response.json();
        if (typeof payload?.detail === "string") {
          error.message = payload.detail;
        } else if (payload?.detail?.message) {
          error.message = String(payload.detail.message);
          if (typeof payload.detail.retryAfterSeconds === "number") {
            error.retryAfterSeconds = payload.detail.retryAfterSeconds;
          }
        }
      } catch {
        // Keep generic message when body is not JSON.
      }

      throw error;
    }

    return response.json() as Promise<Insight[]>;
  },
  getHistoricalRecords: (range: "week" | "month" | "custom") =>
    getJson<HistoricalRecord[]>(`/historical/records?range=${range}`),
  getHistoricalTimeline: (range: "week" | "month" | "custom") =>
    getJson<HistoricalRecord[]>(`/historical/timeline?range=${range}`),
  getHistoricalSummary: (range: "week" | "month" | "custom") =>
    getJson<HistoricalSummaryPoint[]>(`/historical/summary?range=${range}`),
  getSettings: () => getJson<RuntimeSettings>("/settings"),
  updateSettings: (payload: RuntimeSettings) =>
    fetch(`${API_BASE}/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((r) => {
      if (!r.ok) throw new Error(`Request failed: ${r.status}`);
      return r.json() as Promise<RuntimeSettings>;
    }),
};
