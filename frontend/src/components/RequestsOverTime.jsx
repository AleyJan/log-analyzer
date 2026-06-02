export default function RequestsOverTime({ data }) {
  if (!data || data.length === 0) return null;

  const max = Math.max(...data.map((d) => d.count));
  const HEIGHT = 72;
  const buckets =
    data.length > 80
      ? data.filter((_, i) => i % Math.ceil(data.length / 80) === 0)
      : data;

  function fmt(iso) {
    const d = new Date(iso);
    return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <span className="card-title-icon">▲</span>
          REQUESTS_OVER_TIME
        </div>
        <div className="chart-meta">
          peak {max} req/min · {data.length} buckets
        </div>
      </div>
      <div className="chart-wrap">
        <div className="chart-bars">
          {buckets.map((b, i) => {
            const h = max > 0 ? Math.max(2, (b.count / max) * HEIGHT) : 2;
            const opacity = 0.4 + (b.count / max) * 0.6;
            return (
              <div
                key={i}
                className="chart-bar"
                data-tip={`${fmt(b.time)} · ${b.count} req`}
                style={{
                  height: `${h}px`,
                  background: `var(--amber)`,
                  opacity,
                }}
              />
            );
          })}
        </div>
        <div className="chart-axis">
          <span>{fmt(buckets[0]?.time)}</span>
          <span>{fmt(buckets[Math.floor(buckets.length / 2)]?.time)}</span>
          <span>{fmt(buckets[buckets.length - 1]?.time)}</span>
        </div>
      </div>
    </div>
  );
}
