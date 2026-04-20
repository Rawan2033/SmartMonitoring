import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../api";
import KpiCard from "../components/KpiCard";
import BarEventsChart from "../components/charts/BarEventsChart";
import LineTrendChart from "../components/charts/LineTrendChart";
import SolarPowerChart from "../components/charts/SolarPowerChart";
import type { DashboardMetrics, Insight, RuntimeSettings, TrendPoint, TriggerEvent } from "../types";

export default function DashboardPage(): JSX.Element {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [events, setEvents] = useState<TriggerEvent[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [cooldownSecondsLeft, setCooldownSecondsLeft] = useState(0);
  const [insightNotice, setInsightNotice] = useState<string | null>(null);
  const [appSettings, setAppSettings] = useState<RuntimeSettings | null>(null);

  const loadDashboard = useCallback(async () => {
    const [metricsData, trendsData, eventsData] = await Promise.all([
      api.getCurrentMetrics(),
      api.getTrendData(),
      api.getTriggeredEvents()
    ]);
    setMetrics(metricsData);
    setTrends(trendsData);
    setEvents(eventsData);
  }, []);

  useEffect(() => {
    api.getSettings().then(setAppSettings).catch(() => undefined);
  }, []);

  useEffect(() => {
    const refreshMs = (appSettings?.dashboardRefreshSeconds ?? 300) * 1000;
    void loadDashboard();
    const id = window.setInterval(() => {
      void loadDashboard();
    }, refreshMs);
    return () => window.clearInterval(id);
  }, [loadDashboard, appSettings?.dashboardRefreshSeconds]);

  const handleGenerateInsights = useCallback(async () => {
    if (cooldownSecondsLeft > 0) {
      setInsightNotice(`Please wait ${cooldownSecondsLeft}s before generating again.`);
      return;
    }

    setLoadingInsights(true);
    try {
      setInsights(await api.generateInsights());
      const cooldown = appSettings?.insightCooldownSeconds ?? 60;
      setCooldownSecondsLeft(cooldown);
      setInsightNotice(`Insight generated. You can request another one after ${cooldown} seconds.`);
    } catch (error) {
      const err = error as Error & { status?: number; retryAfterSeconds?: number };
      if (err.status === 429) {
        const retry = Math.max(1, err.retryAfterSeconds ?? 60);
        setCooldownSecondsLeft(retry);
        setInsightNotice(`Please wait ${retry}s before generating again.`);
      } else {
        setInsightNotice("Could not generate insights right now. Please try again shortly.");
      }
    } finally {
      setLoadingInsights(false);
    }
  }, [cooldownSecondsLeft, appSettings?.insightCooldownSeconds]);

  useEffect(() => {
    if (cooldownSecondsLeft <= 0) return;
    const id = window.setInterval(() => {
      setCooldownSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [cooldownSecondsLeft]);

  useEffect(() => {
    if (!insightNotice) return;
    const id = window.setTimeout(() => setInsightNotice(null), 3800);
    return () => window.clearTimeout(id);
  }, [insightNotice]);

  const refreshLabel = useMemo(() => {
    if (!metrics) return "--";
    return new Date(metrics.lastUpdated).toLocaleString();
  }, [metrics]);

  const refreshIntervalLabel = useMemo(() => {
    const seconds = appSettings?.dashboardRefreshSeconds ?? 300;
    if (seconds % 60 === 0) {
      return `${seconds / 60} min`;
    }
    return `${seconds} sec`;
  }, [appSettings?.dashboardRefreshSeconds]);

  return (
    <section>
      <div className="dashboard-top-row animate-in">
        <div className="status-row">
          <span className="pill">Auto-refresh: {refreshIntervalLabel}</span>
          <span className="pill">Last updated: {refreshLabel}</span>
        </div>
      </div>

      <div className="dashboard-title-center animate-in" style={{ animationDelay: "80ms" }}>
        <span className="title-blob blob-a" aria-hidden />
        <span className="title-blob blob-b" aria-hidden />
        <div className="dashboard-title-badge">Live Dashboard</div>
        <div>
          <h2>Dashboard Overview</h2>
          <p>What is happening now</p>
        </div>
        <span className="dashboard-title-wave" aria-hidden />
      </div>

      <div className="kpi-grid kpi-grid-five">
        <KpiCard
          title="Soiling / Dust Index"
          value={`${metrics?.dustPercent.toFixed(1) ?? "0.0"}%`}
          detail={`Avg raw reading: ${metrics?.reflectivityRawAvg.toFixed(0) ?? "0"} / 3000`}
          status={metrics?.statusDust ?? "Moderate"}
          accent="#8f52ff"
          animationDelayMs={60}
        />
        <KpiCard
          title="Temperature"
          value={`${metrics?.temperatureC.toFixed(1) ?? "0.0"}C`}
          status={metrics?.statusTemperature ?? "Normal"}
          accent="#ff5b00"
          animationDelayMs={130}
        />
        <KpiCard
          title="Humidity (%RH)"
          value={`${metrics?.humidityPercent.toFixed(1) ?? "0.0"}%`}
          status={metrics?.statusHumidity ?? "Normal"}
          accent="#2f6fed"
          animationDelayMs={200}
        />
        <KpiCard
          title="Cleaning Active"
          value={metrics?.cleaningActive ? "On" : "Off"}
          detail={metrics?.cleaningActive ? "On = cleaning active" : "Off = cleaning inactive"}
          status={metrics?.statusCleaning ?? "Inactive"}
          accent={metrics?.cleaningActive ? "#13a85e" : "#d32a2a"}
          animationDelayMs={270}
        />
        <KpiCard
          title="Solar Power Output"
          value={`${metrics?.solarPowerMw.toFixed(1) ?? "0.0"} mW`}
          status={metrics?.statusSolar ?? "Low"}
          accent="#f3a712"
          animationDelayMs={340}
        />
      </div>

      <div className="chart-grid chart-grid-three">
        <article className="panel animate-in" style={{ animationDelay: "260ms" }}>
          <h3>Sensor Trends</h3>
          <p>Dust, humidity, and temperature over the last 2 hours</p>
          <LineTrendChart data={trends} />
        </article>
        <article className="panel animate-in" style={{ animationDelay: "320ms" }}>
          <h3>Triggered Events</h3>
          <p>Cleaning-active counts grouped by hour (Last 24 hours)</p>
          <BarEventsChart data={events} />
        </article>
        <article className="panel animate-in" style={{ animationDelay: "380ms" }}>
          <h3>Solar Power Output</h3>
          <p>Power output trend from the INA219 sensor</p>
          <SolarPowerChart data={trends} />
        </article>
      </div>

      <article className="insights animate-in" style={{ animationDelay: "420ms" }}>
        <div className="insights-head">
          <div>
            <h3>AI Insight Summary</h3>
            <p>Powered by OpenAI</p>
          </div>
          <div className="insights-actions">
            <span className="pill ok">OpenAI: Connected</span>
            <button
              type="button"
              onClick={() => void handleGenerateInsights()}
              disabled={loadingInsights || cooldownSecondsLeft > 0}
            >
              {loadingInsights
                ? "Generating..."
                : cooldownSecondsLeft > 0
                ? `Try again in ${cooldownSecondsLeft}s`
                : "Generate new insight"}
            </button>
          </div>
        </div>
        {insightNotice && <div className="insight-alert">{insightNotice}</div>}

        <div className="insight-list">
          {insights.length === 0 ? (
            <p className="empty">No insights yet. Click "Generate new insight".</p>
          ) : (
            insights.map((insight, index) => (
              <div
                key={index}
                className="insight-item animate-in-fast"
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <strong>{insight.title}</strong>
                <p>{insight.reason}</p>
              </div>
            ))
          )}
        </div>
      </article>
    </section>
  );
}
