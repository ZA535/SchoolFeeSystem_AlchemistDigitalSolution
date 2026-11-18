export default function InlineFormCard({ open, title, onClose, error, children }) {
  if (!open) return null;

  return (
    <div className="card form-card">
      <div className="form-card__head">
        <h3 className="card__title">{title}</h3>
        <button type="button" className="btn btn-ghost small" onClick={onClose}>
          Close
        </button>
      </div>
      {error ? <p className="error-banner">{error}</p> : null}
      {children}
    </div>
  );
}