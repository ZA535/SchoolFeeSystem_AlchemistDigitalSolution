import { Link } from 'react-router-dom';
import { formatMoney, monthLabel } from '../api.js';
import { paymentMethodLabel } from '../constants/paymentMethods.js';

export default function PaymentSuccessBanner({ result, onDismiss }) {
  if (!result) return null;
  const { payment, voucher, studentName } = result;
  const paidInFull = voucher.status === 'paid';

  return (
    <div className="card success-banner no-print">
      <h3 style={{ marginTop: 0 }}>Payment recorded</h3>
      <dl className="receipt-summary">
        <div>
          <dt>Receipt number</dt>
          <dd className="mono">{payment.receipt_number}</dd>
        </div>
        <div>
          <dt>Student</dt>
          <dd>{studentName}</dd>
        </div>
        <div>
          <dt>Amount paid</dt>
          <dd>{formatMoney(payment.amount)}</dd>
        </div>
        <div>
          <dt>Payment date</dt>
          <dd>{payment.payment_date}</dd>
        </div>
        <div>
          <dt>Method</dt>
          <dd>{paymentMethodLabel(payment.payment_method)}</dd>
        </div>
        <div>
          <dt>Voucher status</dt>
          <dd>
            <span className={`badge ${voucher.status}`}>{voucher.status}</span>
            {paidInFull ? (
              <span style={{ marginLeft: '0.5rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
                — marked paid for {monthLabel(voucher.billing_year, voucher.billing_month)}
              </span>
            ) : (
              <span style={{ marginLeft: '0.5rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
                — balance {formatMoney(Number(voucher.amount_due) - Number(voucher.amount_paid))}
              </span>
            )}
          </dd>
        </div>
      </dl>
      <div className="toolbar">
        <Link
          to={`/receipt/${voucher.id}?payment=${payment.id}`}
          className="btn"
          target="_blank"
          rel="noreferrer"
        >
          View / print receipt
        </Link>
        <button type="button" className="btn secondary" onClick={onDismiss}>
          Dismiss
        </button>
      </div>
    </div>
  );
}