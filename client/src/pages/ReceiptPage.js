import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import ReceiptPrint from '../components/ReceiptPrint.js';
import LoadingPanel from '../components/LoadingPanel.js';
import { DefaultAppName } from '../enums/defaults.js';

export default function ReceiptPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const paymentId = params.get('payment');
  const [voucher, setVoucher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api
      .getVoucher(id)
      .then(setVoucher)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const payment =
    paymentId && voucher?.payments
      ? voucher.payments.find((p) => p.id === paymentId)
      : voucher?.payments?.[voucher.payments.length - 1];

  return (
    <div>
      <div className="toolbar no-print" style={{ marginBottom: '1rem' }}>
        <button type="button" className="btn" onClick={() => window.print()}>
          Print receipt
        </button>
        <Link to="/vouchers" className="btn secondary">
          Back to vouchers
        </Link>
      </div>
      {error && <p className="error">{error}</p>}
      {voucher && (
        <ReceiptPrint
          voucher={voucher}
          payment={payment}
          schoolName={
            import.meta.env.VITE_SCHOOL_NAME || DefaultAppName.YOUR_SCHOOL_NAME
          }
        />
      )}
      {loading && !error && <LoadingPanel label="Loading receipt…" minHeight="14rem" />}
    </div>
  );
}
