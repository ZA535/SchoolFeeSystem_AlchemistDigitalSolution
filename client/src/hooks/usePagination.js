import { useEffect, useMemo, useState } from 'react';
import { PAGE_SIZE } from '../constants/pagination.js';

export function usePagination(items, pageSize = PAGE_SIZE, resetDeps = []) {
  const [page, setPage] = useState(1);
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1);

  const resetKey = JSON.stringify(resetDeps);

  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  const startIndex = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, totalItems);

  return {
    page,
    setPage,
    pageItems,
    totalPages,
    totalItems,
    pageSize,
    startIndex,
    endIndex,
  };
}
