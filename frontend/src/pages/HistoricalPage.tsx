import { useEffect, useState } from "react";
import { api } from "../api";
import HistoricalSummaryChart from "../components/charts/HistoricalSummaryChart";
import type { HistoricalRecord, HistoricalSummaryPoint } from "../types";

type Range = "week" | "month" | "custom";

function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function HistoricalPage(): JSX.Element {
  const [range, setRange] = useState<Range>("week");
  const [timeline, setTimeline] = useState<HistoricalRecord[]>([]);
  const [records, setRecords] = useState<HistoricalRecord[]>([]);
  const [summary, setSummary] = useState<HistoricalSummaryPoint[]>([]);
  const [customStartDate, setCustomStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return formatDateInput(date);
  });
  const [customEndDate, setCustomEndDate] = useState(() => formatDateInput(new Date()));
  const [appliedCustomRange, setAppliedCustomRange] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    return {
      startDate: formatDateInput(start),
      endDate: formatDateInput(end)
    };
  });
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  useEffect(() => {
    const query =
      range === "custom"
        ? { startDate: appliedCustomRange.startDate, endDate: appliedCustomRange.endDate }
        : {};

    Promise.all([
      api.getHistoricalTimeline(range, query),
      api.getHistoricalRecords(range, query),
      api.getHistoricalSummary(range, query)
    ])
      .then(([t, r, s]) => {
        setTimeline(t);
        setRecords(r);
        setSummary(s);
        setErrorNotice(null);
      })
      .catch(() => {
        setTimeline([]);
        setRecords([]);
        setSummary([]);
        setErrorNotice("Could not load historical data for that range. Please check the selected dates.");
      });
  }, [range, appliedCustomRange.endDate, appliedCustomRange.startDate]);

  const applyCustomRange = () => {
    if (!customStartDate || !customEndDate) {
      setErrorNotice("Please select both a start date and an end date.");
      return;
    }
    if (customStartDate > customEndDate) {
      setErrorNotice("Start date must be before or equal to end date.");
      return;
    }
    setAppliedCustomRange({ startDate: customStartDate, endDate: customEndDate });
    setErrorNotice(null);
  };

  return (
    <section>
      <div className="page-head">
        <div>
          <h2>Historical Data</h2>
          <p>Explore, compare, and prove patterns</p>
        </div>
      </div>

      <div className="filter-bar">
        <span>Date Range:</span>
        <button className={range === "week" ? "active" : ""} onClick={() => setRange("week")}>
          Week
        </button>
        <button className={range === "month" ? "active" : ""} onClick={() => setRange("month")}>
          Month
        </button>
        <button className={range === "custom" ? "active" : ""} onClick={() => setRange("custom")}>
          Custom
        </button>
      </div>
      {range === "custom" ? (
        <div className="custom-range-bar">
          <label className="settings-field">
            <span>Start Date</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
            />
          </label>
          <label className="settings-field">
            <span>End Date</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
            />
          </label>
          <button type="button" className="custom-range-apply" onClick={applyCustomRange}>
            Apply Range
          </button>
        </div>
      ) : null}
      {errorNotice ? <div className="insight-alert">{errorNotice}</div> : null}

      <article className="panel">
        <h3>Trend Summary</h3>
        <p>Daily averages for selected range, including solar output and cleaning activity</p>
        <HistoricalSummaryChart data={summary} />
      </article>

      <article className="panel">
        <h3>Events Timeline</h3>
        <div className="timeline">
          {timeline.slice(0, 12).map((item, idx) => (
            <div key={`${item.dateTime}-${idx}`} className="timeline-item">
              <span className={`dot ${item.eventType === "Cleaning active" ? "green" : "amber"}`} />
              <div>
                <strong>{item.eventType}</strong>
                <p>
                  Dust: {item.dustPercent.toFixed(1)}% | Temp: {item.temperatureC.toFixed(1)}C | Humidity: {item.humidityPercent.toFixed(1)}% | Solar: {item.solarPowerMw.toFixed(1)} mW | Cleaning: <span className={`status-pill ${item.cleaningActive ? "status-on" : "status-off"}`}>{item.cleaningActive ? "On" : "Off"}</span>
                </p>
              </div>
              <time>{item.dateTime}</time>
            </div>
          ))}
        </div>
      </article>

      <article className="panel">
        <h3>Detailed Records</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date-Time</th>
                <th>Dust (%)</th>
                <th>Temp (C)</th>
                <th>Humidity (%)</th>
                <th>Cleaning Status</th>
                <th>Power Output (mW)</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record, idx) => (
                <tr key={`${record.dateTime}-${idx}`}>
                  <td>{record.dateTime}</td>
                  <td>{record.dustPercent.toFixed(1)}</td>
                  <td>{record.temperatureC.toFixed(1)}</td>
                  <td>{record.humidityPercent.toFixed(1)}</td>
                  <td>
                    <span className={`status-pill ${record.cleaningActive ? "status-on" : "status-off"}`}>
                      {record.cleaningActive ? "On" : "Off"}
                    </span>
                  </td>
                  <td>{record.solarPowerMw.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
