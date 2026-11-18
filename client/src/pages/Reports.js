import { useEffect, useState } from 'react';
import { api, formatMoney, monthLabel } from '../api.js';
import { paymentMethodLabel } from '../enums/paymentMethods.js';
import { ToastMessage } from '../enums/messages.js';
import { FormLabel } from '../enums/labels.js';
import { useAuth } from '../auth/AuthContext.js';
import PageHeader from '../components/PageHeader.js';
import TableSkeleton from '../components/TableSkeleton.js';
import LoadingPanel from '../components/LoadingPanel.js';
import TablePagination from '../components/TablePagination.js';
import { usePagination } from '../hooks/usePagination.js';
import { useToast } from '../components/ToastProvider.js';

export default function Reports() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const now = new Date();
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [date, setDate] = useState(now.toISOString().slice(0, 10));
  const [defaulters, setDefaulters] = useState(null);
  const [daily, setDaily] = useState(null);
  const [audit, setAudit] = useState([]);
  const [error, setError] = useState('');
  const [defaultersLoading, setDefaultersLoading] = useState(true);
  const [dailyLoading, setDailyLoading] = useState(true);
  const [auditLoading, setAuditLoading] = useState(false);
  const [monthly, setMonthly] = useState(null);
  const [byClass, setByClass] = useState(null);
  const [feeRules, setFeeRules] = useState(null);
  const [savingRules, setSavingRules] = useState(false);

  useEffect(() => {
    setDefaultersLoading(true);
    setError('');
    api
      .getDefaulters({ year, month })
      .then(setDefaulters)
      .catch((e) => setError(e.message))
      .finally(() => setDefaultersLoading(false));
    api
      .getMonthlyRevenueReport({ year, month })
      .then(setMonthly)
      .catch(() => setMonthly(null));
    api
      .getDefaultersByClass({ year, month })
      .then(setByClass)
      .catch(() => setByClass(null));
  }, [year, month]);

  useEffect(() => {
    setDailyLoading(true);
    api
      .getDailyCollection({ date })
      .then(setDaily)
      .catch(() => setDaily(null))
      .finally(() => setDailyLoading(false));
  }, [date]);

  useEffect(() => {
    if (!isAdmin) return;
    setAuditLoading(true);
    api
      .getAuditLog()
      .then(setAudit)
      .catch(() => setAudit([]))
      .finally(() => setAuditLoading(false));
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    api
      .getFeeRules()
      .then(setFeeRules)
      .catch(() => setFeeRules(null));
  }, [isAdmin]);

  const saveFeeRules = async (e) => {
    e.preventDefault();
    if (!feeRules) return;
    setSavingRules(true);
    try {
      const updated = await api.updateFeeRules({
        late_fee_flat: Number(feeRules.late_fee_flat),
        late_fee_enabled: feeRules.late_fee_enabled,
      });
      setFeeRules(updated);
      toast(ToastMessage.FEE_RULES_UPDATED, { type: 'success' });
    } catch (err) {
      toast(err.message, { type: 'error' });
    } finally {
      setSavingRules(false);
    }
  };

  const defaulterRows = defaulters?.defaulters ?? [];
  const defaultersPagination = usePagination(defaulterRows, undefined, [year, month]);
  const auditPagination = usePagination(audit);

  return (
    <div className="page">
      <PageHeader
        title="Reports"
        description="Daily collection, class defaulters, monthly revenue vs pending, and audit trail"
      />

      {monthly && (
        <div className="card card--elevated">
          <h3 className="card__title">
            Monthly revenue vs pending — {monthLabel(Number(year), Number(month))}
          </h3>
          <div className="metric-grid">
            <div className="metric metric--success">
              <div className="label">Collected</div>
              <div className="value">{formatMoney(monthly.total_revenue)}</div>
            </div>
            <div className="metric metric--warning">
              <div className="label">Pending</div>
              <div className="value">{formatMoney(monthly.total_pending)}</div>
            </div>
            <div className="metric metric--primary">
              <div className="label">Expected</div>
              <div className="value">{formatMoney(monthly.total_expected)}</div>
            </div>
            <div className="metric metric--primary">
              <div className="label">Collection rate</div>
              <div className="value">{monthly.collection_rate_pct}%</div>
            </div>
          </div>
        </div>
      )}

      {byClass?.classes?.length > 0 && (
        <div className="card card--elevated">
          <h3 className="card__title">Class-wise defaulters</h3>
          <div className="table-wrap table-wrap--sticky">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Class / Section</th>
                  <th>Students with balance</th>
                  <th>Total balance</th>
                </tr>
              </thead>
              <tbody>
                {byClass.classes.map((row) => (
                  <tr key={row.class_section}>
                    <td>{row.class_section}</td>
                    <td>{row.defaulter_count}</td>
                    <td>{formatMoney(row.balance_due)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card card--elevated">
        {error && <p className="error-banner">{error}</p>}

        <h3>Overdue defaulters — {monthLabel(Number(year), Number(month))}</h3>
        <div className="filters">
          <label>
            Year
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </label>
          <label>
            Month
            <input
              type="number"
              min="1"
              max="12"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </label>
        </div>
        {defaultersLoading ? (
          <TableSkeleton rows={6} columns={5} />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Roll</th>
                  <th>Class</th>
                  <th>Balance</th>
                  <th>Guardian</th>
                </tr>
              </thead>
              <tbody>
                {defaultersPagination.pageItems.map((v) => (
                  <tr key={v.id}>
                    <td>{v.student?.full_name}</td>
                    <td>{v.student?.roll_number}</td>
                    <td>{v.student?.class_section}</td>
                    <td>{formatMoney(v.balance)}</td>
                    <td>{v.student?.guardian_contact}</td>
                  </tr>
                ))}
                {defaulters && defaulters.count === 0 && (
                  <tr>
                    <td colSpan={5} style={{ color: 'var(--muted)' }}>
                      No overdue students this month.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {!defaultersLoading && defaulterRows.length > 0 && (
          <TablePagination
            page={defaultersPagination.page}
            totalPages={defaultersPagination.totalPages}
            totalItems={defaultersPagination.totalItems}
            startIndex={defaultersPagination.startIndex}
            endIndex={defaultersPagination.endIndex}
            onPageChange={defaultersPagination.setPage}
          />
        )}
      </div>

      <div className="card">
        <h3>Daily collection</h3>
        <label>
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        {dailyLoading ? (
          <LoadingPanel label="Loading daily totals…" minHeight="6rem" />
        ) : daily ? (
          <>
            <p>
              <strong>{formatMoney(daily.total_collected)}</strong> from{' '}
              {daily.payment_count} payment(s)
            </p>
            <ul>
              {Object.entries(daily.by_method || {}).map(([m, amt]) => (
                <li key={m}>
                  {paymentMethodLabel(m)}: {formatMoney(amt)}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="table-empty" style={{ padding: '1rem 0' }}>
            No collection data for this date.
          </p>
        )}
      </div>

      {isAdmin && feeRules && (
        <div className="card card--elevated">
          <h3 className="card__title">Late fee rules (admin)</h3>
          <p className="card-footnote" style={{ marginTop: 0 }}>
            Flat late fee is applied once per voucher after due date. Waivers use
            credit/adjustment entries (no receipt deletion).
          </p>
          <form className="form-grid" onSubmit={saveFeeRules}>
            <label
              style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}
            >
              <input
                type="checkbox"
                checked={Boolean(feeRules.late_fee_enabled)}
                onChange={(e) =>
                  setFeeRules((f) => ({ ...f, late_fee_enabled: e.target.checked }))
                }
              />
              Enable automatic late fee
            </label>
            <label>
              Late fee amount (PKR)
              <input
                type="number"
                min="0"
                step="1"
                value={feeRules.late_fee_flat}
                onChange={(e) =>
                  setFeeRules((f) => ({ ...f, late_fee_flat: e.target.value }))
                }
              />
            </label>
            <button type="submit" className="btn" disabled={savingRules}>
              {savingRules ? FormLabel.SAVING : FormLabel.SAVE_FEE_RULES}
            </button>
          </form>
        </div>
      )}

      {isAdmin && (
        <div className="card">
          <h3>Audit trail (recent)</h3>
          {auditLoading ? (
            <TableSkeleton rows={5} columns={4} />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>When</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Entity</th>
                  </tr>
                </thead>
                <tbody>
                  {auditPagination.pageItems.map((row) => (
                    <tr key={row.id}>
                      <td>{new Date(row.created_at).toLocaleString()}</td>
                      <td>{row.user_email || '—'}</td>
                      <td>{row.action}</td>
                      <td>
                        {row.entity_type}
                        {row.entity_id ? ` #${String(row.entity_id).slice(0, 8)}` : ''}
                      </td>
                    </tr>
                  ))}
                  {audit.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ color: 'var(--muted)' }}>
                        No audit entries yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          {!auditLoading && audit.length > 0 && (
            <TablePagination
              page={auditPagination.page}
              totalPages={auditPagination.totalPages}
              totalItems={auditPagination.totalItems}
              startIndex={auditPagination.startIndex}
              endIndex={auditPagination.endIndex}
              onPageChange={auditPagination.setPage}
            />
          )}
        </div>
      )}
    </div>
  );
}
