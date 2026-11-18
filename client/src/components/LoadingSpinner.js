export default function LoadingSpinner({ label = 'Loading…' }) {
  return (
    <h3 className="loading-state" role="status" aria-live="polite">
      <span className="spinner" aria-hidden />
      {label}
    </h3>
  );
}
