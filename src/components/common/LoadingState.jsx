export function SkeletonRow({ cols = 5 }) {
  return (
    <tr className="skeleton-row">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i}>
          <span className="skeleton-bar" />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonCard() {
  return (
    <div className="card skeleton-card">
      <span className="skeleton-bar" style={{ width: "40%", height: "12px" }} />
      <span className="skeleton-bar" style={{ width: "65%", height: "28px", marginTop: "10px" }} />
      <span className="skeleton-bar" style={{ width: "30%", height: "10px", marginTop: "8px" }} />
    </div>
  );
}

export function SkeletonText({ lines = 3 }) {
  return (
    <div className="skeleton-text-block">
      {Array.from({ length: lines }).map((_, i) => (
        <span
          key={i}
          className="skeleton-bar"
          style={{ width: `${70 + (i % 3) * 10}%`, height: "14px" }}
        />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 6 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} cols={cols} />
      ))}
    </>
  );
}
