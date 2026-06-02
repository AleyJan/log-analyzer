import { useState } from "react";
import Dots from "./Dots";

const PAGE_SIZE = 5;

export default function SlowEndpoints({ data }) {
  const [page, setPage] = useState(0);

  if (!data || data.length === 0) return null;

  const totalPages = Math.ceil(data.length / PAGE_SIZE);
  const pageData = data.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const max = data[0].avgMs;

  function rtColor(ms) {
    if (ms > 2000) return "var(--red)";
    if (ms > 1000) return "var(--amber)";
    return "var(--green)";
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <span className="card-title-icon">▼</span>SLOWEST_ENDPOINTS
        </div>
        <div className="card-title" style={{ color: "var(--text-4)" }}>
          {data.length} total
        </div>
      </div>

      <table className="log-table">
        <thead>
          <tr>
            <th>ENDPOINT</th>
            <th>AVG</th>
            <th>MAX</th>
            <th>HITS</th>
          </tr>
        </thead>
        <tbody>
          {pageData.map((row, i) => {
            const [method, ...pathParts] = row.endpoint.split(" ");
            const path = pathParts.join(" ");
            return (
              <tr key={i}>
                <td>
                  <span className={`method method-${method}`}>{method}</span>
                  <span
                    style={{ marginLeft: "0.5rem", color: "var(--text-2)" }}
                  >
                    {path}
                  </span>
                </td>
                <td>
                  <div className="mini-bar-wrap">
                    <div className="mini-bar-track">
                      <div
                        className="mini-bar-fill"
                        style={{
                          width: `${(row.avgMs / max) * 100}%`,
                          background: rtColor(row.avgMs),
                        }}
                      />
                    </div>
                    <span
                      style={{ color: rtColor(row.avgMs), fontSize: "0.72rem" }}
                    >
                      {row.avgMs}ms
                    </span>
                  </div>
                </td>
                <td style={{ color: "var(--red)", fontSize: "0.72rem" }}>
                  {row.maxMs}ms
                </td>
                <td style={{ color: "var(--text-3)", fontSize: "0.72rem" }}>
                  {row.count}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "0.75rem",
            paddingTop: "0.75rem",
            borderTop: "1px solid var(--border)",
          }}
        >
          <PagBtn
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            ← PREV
          </PagBtn>
          <Dots page={page} totalPages={totalPages} setPage={setPage} />
          <PagBtn
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
          >
            NEXT →
          </PagBtn>
        </div>
      )}
    </div>
  );
}

function PagBtn({ onClick, disabled, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        fontFamily: "var(--mono)",
        fontSize: "0.68rem",
        background: "transparent",
        border: "1px solid var(--border)",
        color: disabled ? "var(--text-4)" : "var(--text-2)",
        padding: "0.28rem 0.7rem",
        borderRadius: "3px",
        cursor: disabled ? "not-allowed" : "pointer",
        letterSpacing: "0.05em",
        transition: "border-color 0.15s, color 0.15s",
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.borderColor = "var(--amber)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
      }}
    >
      {children}
    </button>
  );
}
