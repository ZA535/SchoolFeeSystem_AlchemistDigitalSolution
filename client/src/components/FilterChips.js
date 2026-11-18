export default function FilterChips({ filters, onClear, onRemove }) {
  const active = filters.filter((f) => f.value);
  if (active.length === 0) return null;

  return (
    <div className="filter-chips" aria-label="Active filters">
      {active.map((f) => (
        <button
          key={f.key}
          type="button"
          className="filter-chip"
          onClick={() => onRemove(f.key)}
        >
          <span>
            {f.label}: <strong>{f.value}</strong>
          </span>
          <span aria-hidden>×</span>
        </button>
      ))}
      {active.length > 1 && (
        <button
          type="button"
          className="filter-chip filter-chip--clear"
          onClick={onClear}
        >
          Clear all
        </button>
      )}
    </div>
  );
}
