import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, formatMoney, monthLabel } from '../api.js';

export default function Dashboard() {
  const now = new Date();
  const [year] = useState(now.getFullYear());
  const [month] = useState(now.getMonth() + 1);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);

  const load = () => {
    api
      .getDashboard({ year, month })
      .then(setSummary)
      .catch((e) => setError(e.message));
  };

  useEffect(() => {
    load();
  }, [year, month]);

  const generateMonth = async () => {
    setGenerating(true);
    setError('');
    try {
      await api.generateVouchers({ year, month });
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      <div className="card">
        <h2>Overview — {monthLabel(year, month)}</h2>
        {error && <p className="error">{error}</p>}
        {summary ? (
          <>
            <div className="grid-metrics">
              <div className="metric">
                <div className="label">Total Expected Fee</div>
                <div className="value">{formatMoney(summary.total_expected)}</div>
              </div>
              <div className="metric">
                <div className="label">Total Collected</div>
                <div className="value">{formatMoney(summary.total_collected)}</div>
              </div>
              <div className="metric">
                <div className="label">Total Pending</div>
                <div className="value">{formatMoney(summary.total_pending)}</div>
              </div>
              <div className="metric">
                <div className="label">Overdue (Defaulters)</div>
                <div className="value">{summary.defaulters_count}</div>
              </div>
            </div>
            <p style={{ color: 'var(--muted)', marginTop: '1rem', fontSize: '0.9rem' }}>
              {summary.voucher_count} voucher(s) this month · {summary.student_count} enrolled
              student(s)
            </p>
          </>
        ) : (
          !error && <p>Loading…</p>
        )}
        <div className="toolbar" style={{ marginTop: '1rem' }}>
          <button type="button" className="btn" onClick={generateMonth} disabled={generating}>
            {generating ? 'Generating…' : 'Generate monthly vouchers'}
          </button>
          <Link to="/collect" className="btn secondary">
            Collect fee
          </Link>
          <Link to="/vouchers" className="btn secondary">
            View all vouchers
          </Link>
        </div>
      </div>
    </div>
  );
}