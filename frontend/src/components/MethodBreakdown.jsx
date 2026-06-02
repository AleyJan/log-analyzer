export default function MethodBreakdown({ data }) {
  if (!data || data.length === 0) return null;
  const max = data[0].count;

  const colors = {
    GET: "var(--green)",
    POST: "var(--purple)",
    PUT: "var(--blue)",
    DELETE: "var(--red)",
    PATCH: "var(--amber)",
    HEAD: "var(--text-2)",
    OPTIONS: "var(--text-3)",
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <span className="card-title-icon">◆</span>METHOD_BREAKDOWN
        </div>
      </div>
      {data.map((item) => (
        <div className="bar-row" key={item.method}>
          <div style={{ minWidth: "70px" }}>
            <span className={`method method-${item.method}`}>
              {item.method}
            </span>
          </div>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{
                width: `${(item.count / max) * 100}%`,
                background: colors[item.method] || "var(--text-3)",
              }}
            />
          </div>
          <div className="bar-count">{item.count}</div>
        </div>
      ))}
    </div>
  );
}
