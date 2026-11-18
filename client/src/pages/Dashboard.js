import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, formatMoney, monthLabel } from '../api.js';
import { useAuth } from '../auth/AuthContext.js';
import PageHeader from '../components/PageHeader.js';
import MetricsSkeleton from '../components/MetricsSkeleton.js';

export default function Dashboard() {
  const { canWrite } = useAuth();
  const now = new Date();
  const [year] = useState(now.getFullYear());
  const [month] = useState(now.getMonth() + 1);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);

  const load = ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError('');
    return api
      .getDashboard({ year, month })
      .then(setSummary)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [year, month]);

  const generateMonth = async () => {
    setGenerating(true);
    setError('');
    try {
      await api.generateVouchers({ year, month });
      await load({ silent: true });
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="page">
      <PageHeader
        title={`Overview — ${monthLabel(year, month)}`}
        description="Monthly collections, pending fees, and defaulters at a glance"
      />
      <div className="card card--elevated">
        {error && <p className="error-banner">{error}</p>}
        {loading && !summary ? (
          <MetricsSkeleton />
        ) : summary ? (
          <>
            <div className={`grid-metrics ${loading ? 'data-section--loading' : ''}`}>
              <div className="metric metric--primary">
                <div className="label">Total expected</div>
                <div className="value">{formatMoney(summary.total_expected)}</div>
              </div>
              <div className="metric metric--success">
                <div className="label">Total collected</div>
                <div className="value">{formatMoney(summary.total_collected)}</div>
              </div>
              <div className="metric metric--warning">
                <div className="label">Total pending</div>
                <div className="value">{formatMoney(summary.total_pending)}</div>
              </div>
              <div className="metric metric--danger">
                <div className="label">Overdue defaulters</div>
                <div className="value">{summary.defaulters_count}</div>
              </div>
            </div>
            <p className="card-footnote">
              {summary.voucher_count} voucher(s) this month · {summary.student_count}{' '}
              enrolled student(s)
            </p>
          </>
        ) : (
          !error && !loading && (
            <p className="table-empty" style={{ padding: '1rem 0' }}>
              No dashboard data for this month yet.
            </p>
          )
        )}
        <div className="toolbar" style={{ marginTop: '1rem' }}>
          {canWrite && (
            <button
              type="button"
              className="btn"
              onClick={generateMonth}
              disabled={generating}
            >
              {generating ? 'Generating…' : 'Generate monthly vouchers'}
            </button>
          )}
          {canWrite && (
            <Link to="/collect" className="btn secondary">
              Collect fee
            </Link>
          )}
          <Link to="/vouchers" className="btn secondary">
            View all vouchers
          </Link>
        </div>
      </div>
    </div>
  );
}
