type KpiCardProps = {
  title: string;
  value: string;
  status: string;
  accent: string;
  animationDelayMs?: number;
};

export default function KpiCard({
  title,
  value,
  status,
  accent,
  animationDelayMs = 0
}: KpiCardProps): JSX.Element {
  return (
    <article className="kpi-card animate-in" style={{ animationDelay: `${animationDelayMs}ms` }}>
      <div className="kpi-header">
        <span className="badge" style={{ color: accent, borderColor: `${accent}33` }}>
          {status}
        </span>
      </div>
      <p className="kpi-title">{title}</p>
      <p className="kpi-value">{value}</p>
      <div className="kpi-track">
        <span style={{ width: "42%", background: accent }} />
      </div>
    </article>
  );
}
