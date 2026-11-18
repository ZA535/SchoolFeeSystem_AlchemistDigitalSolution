import { formatMoney, monthLabel } from '../api.js';

const METHOD_LABELS = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  easypaisa_jazzcash: 'EasyPaisa / JazzCash',
};

export default function ReceiptPrint({
  voucher,
  payment,
  schoolName = 'Your School Name',
}) {
  const student = voucher.student;
  const remaining = Number(voucher.amount_due) - Number(voucher.amount_paid);

  return (
    <div className="print-receipt">
      <h1>{schoolName}</h1>
      <p style={{ textAlign: 'center', margin: '0 0 1rem' }}>Fee Payment Receipt</p>
      <p>
        <strong>Receipt #:</strong> {payment?.receipt_number || voucher.receipt_number}
      </p>
      <p>
        <strong>Date:</strong>{' '}
        {payment?.payment_date || new Date().toISOString().slice(0, 10)}
      </p>
      <hr />
      <p>
        <strong>Student:</strong> {student?.full_name}
      </p>
      <p>
        <strong>Roll:</strong> {student?.roll_number} · <strong>Class:</strong>{' '}
        {student?.class_section}
      </p>
      <p>
        <strong>Billing period:</strong>{' '}
        {monthLabel(voucher.billing_year, voucher.billing_month)}
      </p>
      <hr />
      {payment ? (
        <>
          <p>
            <strong>Amount paid (this transaction):</strong>{' '}
            {formatMoney(payment.amount)}
          </p>
          <p>
            <strong>Method:</strong>{' '}
            {METHOD_LABELS[payment.payment_method] || payment.payment_method}
          </p>
        </>
      ) : null}
      <p>
        <strong>Total paid on voucher:</strong> {formatMoney(voucher.amount_paid)}
      </p>
      <p>
        <strong>Fee due:</strong> {formatMoney(voucher.amount_due)}
      </p>
      {remaining > 0.01 && (
        <p>
          <strong>Remaining balance:</strong> {formatMoney(remaining)}
        </p>
      )}
      <p style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: '#555' }}>
        Thank you for your payment.
      </p>
    </div>
  );
}
