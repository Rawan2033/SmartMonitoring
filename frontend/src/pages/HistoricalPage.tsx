import { useEffect, useState } from "react";
import { api } from "../api";
import HistoricalSummaryChart from "../components/charts/HistoricalSummaryChart";
import type { HistoricalRecord, HistoricalSummaryPoint } from "../types";

type Range = "week" | "month" | "custom";

export default function HistoricalPage(): JSX.Element {
  const [range, setRange] = useState<Range>("week");
  const [timeline, setTimeline] = useState<HistoricalRecord[]>([]);
  const [records, setRecords] = useState<HistoricalRecord[]>([]);
  const [summary, setSummary] = useState<HistoricalSummaryPoint[]>([]);

  useEffect(() => {
    Promise.all([
      api.getHistoricalTimeline(range),
      api.getHistoricalRecords(range),
      api.getHistoricalSummary(range)
    ]).then(([t, r, s]) => {
      setTimeline(t);
      setRecords(r);
      setSummary(s);
    });
  }, [range]);

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

      <article className="panel">
        <h3>Trend Summary</h3>
        <p>Daily averages for selected range (weekly/monthly)</p>
        <HistoricalSummaryChart data={summary} />
      </article>

      <article className="panel">
        <h3>Events Timeline</h3>
        <div className="timeline">
          {timeline.slice(0, 12).map((item, idx) => (
            <div key={`${item.date}-${item.time}-${idx}`} className="timeline-item">
              <span className={`dot ${item.eventType === "Cleaning active" ? "green" : "amber"}`} />
              <div>
                <strong>{item.eventType}</strong>
                <p>
                  Dust: {item.dustPercent.toFixed(1)}% | Temp: {item.temperatureC.toFixed(1)}C | Humidity: {item.humidityPercent.toFixed(1)}% | Voltage: {item.voltageV.toFixed(2)} kV
                </p>
              </div>
              <time>
                {item.date} {item.time}
              </time>
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
                <th>Date</th>
                <th>Time</th>
                <th>Dust (%)</th>
                <th>Temp (C)</th>
                <th>Humidity (%)</th>
                <th>Voltage (kV)</th>
                <th>Cleaning</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record, idx) => (
                <tr key={`${record.date}-${record.time}-${idx}`}>
                  <td>{record.date}</td>
                  <td>{record.time}</td>
                  <td>{record.dustPercent.toFixed(1)}</td>
                  <td>{record.temperatureC.toFixed(1)}</td>
                  <td>{record.humidityPercent.toFixed(1)}</td>
                  <td>{record.voltageV.toFixed(2)}</td>
                  <td>{record.cleaningActive ? "Active" : "Off"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
