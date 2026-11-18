export default function EmptyState({ title, description, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon" aria-hidden>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeWidth="1.75" strokeLinecap="round" d="M4 7h16M4 12h10M4 17h7" />
          <rect x="3" y="4" width="18" height="16" rx="3" strokeWidth="1.75" />
        </svg>
      </div>
      <h3 className="empty-state__title">{title}</h3>
      {description ? <p className="empty-state__desc">{description}</p> : null}
      {action ? <div className="empty-state__action">{action}</div> : null}
    </div>
  );
}