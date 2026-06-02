import { useState } from "react";
import Dots from "./Dots";

const PAGE_SIZE = 5;

export default function TopEndpoints({ data }) {
  const [page, setPage] = useState(0);

  if (!data || data.length === 0) return null;

  const totalPages = Math.ceil(data.length / PAGE_SIZE);
  const pageData = data.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const max = data[0].count;

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <span className="card-title-icon">▲</span>TOP_ENDPOINTS
        </div>
        <div className="card-title" style={{ color: "var(--text-4)" }}>
          {data.length} total
        </div>
      </div>

      <table className="log-table">
        <thead>
          <tr>
            <th>ENDPOINT</th>
            <th>HITS</th>
            <th>ERRORS</th>
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
                          width: `${(row.count / max) * 100}%`,
                          background: "var(--purple)",
                        }}
                      />
                    </div>
                    <span
                      style={{ fontSize: "0.72rem", color: "var(--text-2)" }}
                    >
                      {row.count}
                    </span>
                  </div>
                </td>
                <td>
                  <span
                    className={`badge ${row.errors > 0 ? "badge-red" : "badge-green"}`}
                  >
                    {row.errors}
                  </span>
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
