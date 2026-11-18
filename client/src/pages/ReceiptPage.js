import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import ReceiptPrint from '../components/ReceiptPrint.js';

export default function ReceiptPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const paymentId = params.get('payment');
  const [voucher, setVoucher] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getVoucher(id)
      .then(setVoucher)
      .catch((e) => setError(e.message));
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
          schoolName={import.meta.env.VITE_SCHOOL_NAME || 'Your School Name'}
        />
      )}
      {!voucher && !error && <p>Loading…</p>}
    </div>
  );
}
