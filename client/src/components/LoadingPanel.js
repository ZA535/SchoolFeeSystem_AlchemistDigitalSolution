import LoadingSpinner from './LoadingSpinner.js';

export default function LoadingPanel({ label = 'Loading data…', minHeight = '12rem' }) {
  return (
    <div
      className="loader-panel"
      style={{ minHeight }}
      role="status"
      aria-live="polite"
    >
      <LoadingSpinner label={label} size="lg" />
    </div>
  );
}
