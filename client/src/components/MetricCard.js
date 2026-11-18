export default function MetricCard({ label, value, variant = 'primary', hint }) {
  return (
    <article className={`metric-card metric-card--${variant}`}>
      <div className="metric-card__glow" aria-hidden />
      <div className="metric-card__content">
        <span className="metric-card__label">{label}</span>
        <span className="metric-card__value">{value}</span>
        {hint ? <span className="metric-card__hint">{hint}</span> : null}
      </div>
    </article>
  );
}
