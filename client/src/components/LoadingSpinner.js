export default function LoadingSpinner({
  label = 'Loading…',
  size = 'md',
  centered = false,
  className = '',
}) {
  const rootClass = [
    'loading-state',
    size === 'lg' ? 'loading-state--lg' : '',
    centered ? 'loading-state--centered' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClass} role="status" aria-live="polite">
      <span className={`spinner ${size === 'lg' ? 'spinner--lg' : ''}`} aria-hidden />
      <span className="loading-state__label">{label}</span>
    </div>
  );
}