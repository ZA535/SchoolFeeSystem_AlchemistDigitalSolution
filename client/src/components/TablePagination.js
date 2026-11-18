export default function TablePagination({
  page,
  totalPages,
  totalItems,
  startIndex,
  endIndex,
  onPageChange,
}) {
  if (totalItems <= 0) return null;

  const showControls = totalPages > 1;

  return (
    <nav className="table-pagination" aria-label="Table pages">
      <span className="table-pagination__meta">
        {showControls
          ? `Showing ${startIndex}–${endIndex} of ${totalItems}`
          : `${totalItems} record${totalItems === 1 ? '' : 's'}`}
      </span>
      {showControls ? (
        <div className="table-pagination__controls">
          <button
            type="button"
            className="btn small secondary"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </button>
          <span className="table-pagination__page" aria-current="page">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className="btn small secondary"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </button>
        </div>
      ) : null}
    </nav>
  );
}
