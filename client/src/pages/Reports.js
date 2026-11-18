import { useEffect, useState } from 'react';
import { api, formatMoney, monthLabel } from '../api.js';
import { paymentMethodLabel } from '../constants/paymentMethods.js';
import { useAuth } from '../auth/AuthContext.js';

export default function Reports() {
  const { isAdmin } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [date, setDate] = useState(now.toISOString().slice(0, 10));
  const [defaulters, setDefaulters] = useState(null);
  const [daily, setDaily] = useState(null);
  const [audit, setAudit] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    api
      .getDefaulters({ year, month })
      .then(setDefaulters)
      .catch((e) => setError(e.message));
  }, [year, month]);

  useEffect(() => {
    api
      .getDailyCollection({ date })
      .then(setDaily)
      .catch(() => {});
  }, [date]);

  useEffect(() => {
    if (!isAdmin) return;
    api
      .getAuditLog()
      .then(setAudit)
      .catch(() => setAudit([]));
  }, [isAdmin]);

  return (
    <>
      <div className="card">
        <h2>Reports</h2>
        {error && <p className="error">{error}</p>}

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
              {(defaulters?.defaulters ?? []).map((v) => (
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
      </div>

      <div className="card">
        <h3>Daily collection</h3>
        <label>
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        {daily && (
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
        )}
      </div>

      {isAdmin && (
        <div className="card">
          <h3>Audit trail (recent)</h3>
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
                {audit.map((row) => (
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
        </div>
      )}
    </>
  );
}
