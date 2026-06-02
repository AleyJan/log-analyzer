import { useState } from "react";
import Dots from "./Dots";

const PAGE_SIZE = 5;

export default function SkippedLines({ data }) {
  const [page, setPage] = useState(0);

  if (!data) return null;

  const { reasons } = data;
  const examples = data.examples || [];
  const total = Object.values(reasons).reduce((a, b) => a + b, 0);
  const totalPages = Math.ceil((examples?.length || 0) / PAGE_SIZE);
  const pageExamples = examples.slice(
    page * PAGE_SIZE,
    page * PAGE_SIZE + PAGE_SIZE,
  );

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <span className="card-title-icon">!</span>SKIPPED_LINES
        </div>
        <span className="badge badge-amber">{total} total</span>
      </div>

      {/* Reason breakdown */}
      <div style={{ marginBottom: "1rem" }}>
        {Object.entries(reasons).map(([reason, count]) => (
          <div className="skip-reason-row" key={reason}>
            <span style={{ color: "var(--text-2)" }}>{reason}</span>
            <span className="badge badge-gray">{count}</span>
          </div>
        ))}
      </div>

      {/* Examples with pagination */}
      {examples.length > 0 && (
        <>
          <div className="card-header" style={{ marginBottom: "0.5rem" }}>
            <div className="card-title">
              <span className="card-title-icon">→</span>EXAMPLES
            </div>
            <span
              style={{
                fontFamily: "var(--mono)",
                fontSize: "0.62rem",
                color: "var(--text-3)",
              }}
            >
              {examples.length} lines
            </span>
          </div>

          <div className="skip-list">
            {pageExamples.map((ex, i) => (
              <div className="skip-example-block" key={i}>
                <div className="skip-example-meta">
                  <span className="skip-line-num">L{ex.lineNumber}</span>
                  <span className="skip-reason-tag">
                    {ex.reason || "unrecognized format"}
                  </span>
                </div>
                <div className="skip-example-raw">{ex.raw}</div>
              </div>
            ))}
          </div>

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
        </>
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
