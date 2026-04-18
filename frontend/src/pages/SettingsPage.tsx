import { useEffect, useState } from "react";
import { api } from "../api";
import type { RuntimeSettings } from "../types";

const DEFAULT_SETTINGS: RuntimeSettings = {
  cleaningDustThreshold: 35,
  voltageOnThreshold: 0.9,
  insightCooldownSeconds: 60,
  insightDailyCap: 30,
  dashboardRefreshSeconds: 300,
};

export default function SettingsPage(): JSX.Element {
  const [form, setForm] = useState<RuntimeSettings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    api
      .getSettings()
      .then((settings) => setForm(settings))
      .catch(() => setNotice("Could not load settings. Showing defaults."));
  }, []);

  const onChange = (key: keyof RuntimeSettings, value: number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSave = async () => {
    setSaving(true);
    try {
      const saved = await api.updateSettings(form);
      setForm(saved);
      setNotice("Settings saved successfully.");
    } catch {
      setNotice("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
      setTimeout(() => setNotice(null), 3500);
    }
  };

  return (
    <section>
      <div className="page-head">
        <div>
          <h2>Settings</h2>
          <p>Configure thresholds, insight limits, and refresh behavior.</p>
        </div>
      </div>

      <article className="panel">
        <h3>Cleaning Logic</h3>
        <div className="settings-grid">
          <label className="settings-field">
            <span>Dust threshold for cleaning trigger (%)</span>
            <input
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={form.cleaningDustThreshold}
              onChange={(e) => onChange("cleaningDustThreshold", Number(e.target.value))}
            />
          </label>
          <div className="settings-field">
            <span>Cleaning signal mode</span>
            <input type="text" value="Real ESP 0/1 cleaning state" disabled />
          </div>
        </div>
      </article>

      <article className="panel">
        <h3>Insight Limits</h3>
        <div className="settings-grid">
          <label className="settings-field">
            <span>Insight cooldown (seconds)</span>
            <input
              type="number"
              min={5}
              max={3600}
              step={1}
              value={form.insightCooldownSeconds}
              onChange={(e) => onChange("insightCooldownSeconds", Number(e.target.value))}
            />
          </label>
          <label className="settings-field">
            <span>Daily insight cap (requests/day)</span>
            <input
              type="number"
              min={1}
              max={5000}
              step={1}
              value={form.insightDailyCap}
              onChange={(e) => onChange("insightDailyCap", Number(e.target.value))}
            />
          </label>
        </div>
      </article>

      <article className="panel">
        <h3>Dashboard Refresh</h3>
        <div className="settings-grid">
          <label className="settings-field">
            <span>Auto-refresh interval (seconds)</span>
            <input
              type="number"
              min={15}
              max={3600}
              step={5}
              value={form.dashboardRefreshSeconds}
              onChange={(e) => onChange("dashboardRefreshSeconds", Number(e.target.value))}
            />
          </label>
        </div>
      </article>

      <div className="settings-actions">
        <button type="button" onClick={onSave} disabled={saving}>
          {saving ? "Saving..." : "Save settings"}
        </button>
        {notice && <div className="insight-alert">{notice}</div>}
      </div>
    </section>
  );
}
