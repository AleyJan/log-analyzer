export default function Overview({ data }) {
  if (!data) return null;

  const stats = [
    {
      label: "TOTAL_REQUESTS",
      value: data.totalRequests.toLocaleString(),
      color: "var(--amber)",
      sub: "parsed entries",
    },
    {
      label: "TOTAL_ERRORS",
      value: data.totalErrors.toLocaleString(),
      color: "var(--red)",
      sub: "4xx + 5xx",
    },
    {
      label: "ERROR_RATE",
      value: `${data.errorRate}%`,
      color: data.errorRate > 10 ? "var(--red)" : "var(--green)",
      sub: "of all requests",
    },
    {
      label: "SKIPPED_LINES",
      value: data.skippedLines.toLocaleString(),
      color: "var(--amber)",
      sub: "unrecognized",
    },
    {
      label: "LOG_DURATION",
      value: data.durationMinutes ? `${data.durationMinutes}m` : "—",
      color: "var(--blue)",
      sub: "time window",
    },
  ];

  return (
    <div className="overview-grid">
      {stats.map((s) => (
        <div className="stat-card" key={s.label}>
          <div className="stat-label">{s.label}</div>
          <div className="stat-value" style={{ color: s.color }}>
            {s.value}
          </div>
          <div className="stat-sub">{s.sub}</div>
        </div>
      ))}
    </div>
  );
}
