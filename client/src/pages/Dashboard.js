import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, formatMoney, monthLabel } from '../api.js';
import { useAuth } from '../auth/AuthContext.js';
import PageHeader from '../components/PageHeader.js';
import MetricsSkeleton from '../components/MetricsSkeleton.js';
import MetricCard from '../components/MetricCard.js';
import { useToast } from '../components/ToastProvider.js';
import WelcomeBanner from '../components/WelcomeBanner.js';

export default function Dashboard() {
  const { canWrite, canCollect, user } = useAuth();
  const { toast } = useToast();
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
      toast(`Monthly vouchers generated for ${monthLabel(year, month)}.`, {
        type: 'success',
      });
    } catch (e) {
      setError(e.message);
      toast(e.message, { type: 'error' });
    } finally {
      setGenerating(false);
    }
  };

  const collectionRate =
    summary && Number(summary.total_expected) > 0
      ? Math.min(
          100,
          Math.round(
            (Number(summary.total_collected) / Number(summary.total_expected)) * 100
          )
        )
      : 0;

  return (
    <div className="page">
      <WelcomeBanner name={user?.full_name} />
      <PageHeader
        title={`Overview — ${monthLabel(year, month)}`}
        description="Monthly collections, pending fees, and defaulters at a glance"
      />

      {canWrite && (
        <div className="quick-actions no-print">
          {canCollect && (
            <Link to="/collect" className="quick-action quick-action--teal">
              <span className="quick-action__title">Collect fee</span>
              <span className="quick-action__desc">
                Record cash, bank, or wallet payments
              </span>
            </Link>
          )}
          <Link to="/vouchers" className="quick-action quick-action--indigo">
            <span className="quick-action__title">Fee vouchers</span>
            <span className="quick-action__desc">
              Filter, pay, print challans &amp; receipts
            </span>
          </Link>
          <Link to="/reports" className="quick-action quick-action--amber">
            <span className="quick-action__title">Reports</span>
            <span className="quick-action__desc">
              Defaulters &amp; daily collection totals
            </span>
          </Link>
        </div>
      )}

      <div className="card card--elevated card--dashboard">
        {error && <p className="error-banner">{error}</p>}
        {loading && !summary ? (
          <MetricsSkeleton />
        ) : summary ? (
          <>
            <div className={`metric-grid ${loading ? 'data-section--loading' : ''}`}>
              <MetricCard
                variant="primary"
                label="Total expected"
                value={formatMoney(summary.total_expected)}
                hint="Monthly fee target"
              />
              <MetricCard
                variant="success"
                label="Total collected"
                value={formatMoney(summary.total_collected)}
                hint={`${collectionRate}% of expected`}
              />
              <MetricCard
                variant="warning"
                label="Total pending"
                value={formatMoney(summary.total_pending)}
                hint="Still to collect"
              />
              <MetricCard
                variant="danger"
                label="Overdue defaulters"
                value={String(summary.defaulters_count)}
                hint="Needs follow-up"
              />
            </div>

            <div className="collection-progress" aria-label="Collection progress">
              <div className="collection-progress__head">
                <span>Collection progress</span>
                <strong>{collectionRate}%</strong>
              </div>
              <div className="collection-progress__track">
                <div
                  className="collection-progress__bar"
                  style={{ width: `${collectionRate}%` }}
                />
              </div>
              <p className="card-footnote">
                {summary.voucher_count} voucher(s) · {summary.student_count} active
                student(s)
              </p>
            </div>

            <div className="insight-strip">
              <div>
                <span className="insight-strip__label">Pending vs expected</span>
                <span className="insight-strip__value">
                  {formatMoney(summary.total_pending)}
                </span>
              </div>
              <div>
                <span className="insight-strip__label">Defaulters</span>
                <span className="insight-strip__value">{summary.defaulters_count}</span>
              </div>
            </div>
          </>
        ) : (
          !error &&
          !loading && (
            <p className="table-empty" style={{ padding: '1rem 0' }}>
              No dashboard data for this month yet. Generate vouchers to get started.
            </p>
          )
        )}

        {canWrite && (
          <div className="toolbar toolbar--dashboard">
            <button
              type="button"
              className="btn"
              onClick={generateMonth}
              disabled={generating}
            >
              {generating ? 'Generating…' : 'Generate monthly vouchers'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
