// Windowed dots — shows a sliding window of dots so it never overflows.
// Active dot stays near the second-to-last position as you move forward.
export default function Dots({ page, totalPages, setPage, windowSize = 7 }) {
  let start = Math.max(0, page - (windowSize - 2));
  let end = Math.min(totalPages, start + windowSize);
  start = Math.max(0, end - windowSize);

  const visible = [];
  for (let i = start; i < end; i++) visible.push(i);

  return (
    <div style={{ display: "flex", gap: "0.3rem", alignItems: "center" }}>
      {visible.map((i) => (
        <div
          key={i}
          onClick={() => setPage(i)}
          style={{
            width: i === page ? "16px" : "6px",
            height: "6px",
            borderRadius: "3px",
            background: i === page ? "var(--amber)" : "var(--border-bright)",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        />
      ))}
    </div>
  );
}
