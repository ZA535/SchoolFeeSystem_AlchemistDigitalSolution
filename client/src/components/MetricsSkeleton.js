export default function MetricsSkeleton({ count = 4 }) {
  return (
    <div className="metric-grid metrics-skeleton" aria-busy="true" aria-live="polite">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="metric metric--skeleton">
          <span className="skeleton skeleton--label" />
          <span className="skeleton skeleton--value" />
        </div>
      ))}
    </div>
  );
}