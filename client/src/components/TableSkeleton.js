export default function TableSkeleton({ rows = 6, columns = 5 }) {
  const safeRows = Math.max(1, rows);
  const safeCols = Math.max(1, columns);
  return (
    <div className="table-wrap table-skeleton-wrap" aria-busy="true" aria-live="polite">
      <table className="table-skeleton">
        <thead>
          <tr>
            {Array.from({ length: safeCols }, (_, i) => (
              <th key={i}>
                <span className="skeleton skeleton--text" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: safeRows }, (_, r) => (
            <tr key={r}>
              {Array.from({ length: safeCols }, (_, c) => (
                <td key={c}>
                  <span
                    className="skeleton skeleton--text"
                    style={{ width: c === 0 ? '70%' : c === safeCols - 1 ? '45%' : '55%' }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="table-skeleton__label">Loading records…</p>
    </div>
  );
}