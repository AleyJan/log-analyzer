export default function StatusBreakdown({ data }) {
  if (!data) return null;
  const { groups, breakdown } = data;

  const groupConfig = {
    "2xx": { color: "var(--green)", label: "SUCCESS" },
    "3xx": { color: "var(--blue)", label: "REDIRECT" },
    "4xx": { color: "var(--amber)", label: "CLIENT ERR" },
    "5xx": { color: "var(--red)", label: "SERVER ERR" },
    unknown: { color: "var(--text-3)", label: "UNKNOWN" },
  };

  function statusClass(code) {
    if (code >= 500) return "status-5xx";
    if (code >= 400) return "status-4xx";
    if (code >= 300) return "status-3xx";
    if (code >= 200) return "status-2xx";
    return "status-unk";
  }

  const max = Math.max(...Object.values(groups));

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <span className="card-title-icon">◆</span>STATUS_BREAKDOWN
        </div>
      </div>

      <div style={{ marginBottom: "1.25rem" }}>
        {Object.entries(groups).map(([g, count]) => {
          const cfg = groupConfig[g] || groupConfig.unknown;
          return (
            <div className="bar-row" key={g}>
              <div
                className="bar-label"
                style={{ color: cfg.color, fontSize: "0.65rem" }}
              >
                {cfg.label}
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{
                    width: max > 0 ? `${(count / max) * 100}%` : "0%",
                    background: cfg.color,
                  }}
                />
              </div>
              <div className="bar-count">{count}</div>
            </div>
          );
        })}
      </div>

      <div className="card-title" style={{ marginBottom: "0.6rem" }}>
        <span className="card-title-icon">○</span>TOP_CODES
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
        {breakdown.slice(0, 10).map((item) => (
          <span key={item.code} className={`status ${statusClass(item.code)}`}>
            {item.code} ×{item.count}
          </span>
        ))}
      </div>
    </div>
  );
}
