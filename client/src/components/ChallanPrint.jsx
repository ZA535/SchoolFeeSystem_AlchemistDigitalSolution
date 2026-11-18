import { formatMoney, monthLabel } from '../api.js';

export default function ChallanPrint({ voucher, schoolName = 'Your School Name' }) {
  const student = voucher.student;
  const balance = Number(voucher.amount_due) - Number(voucher.amount_paid);

  return (
    <div className="print-receipt">
      <h1>{schoolName}</h1>
      <p style={{ textAlign: 'center', margin: '0 0 1rem' }}>Monthly Fee Challan</p>
      <p>
        <strong>Challan ref:</strong> {voucher.id.slice(0, 8).toUpperCase()}
      </p>
      <p>
        <strong>Billing period:</strong> {monthLabel(voucher.billing_year, voucher.billing_month)}
      </p>
      <p>
        <strong>Due date:</strong> {voucher.due_date}
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
        <strong>Guardian contact:</strong> {student?.guardian_contact}
      </p>
      <hr />
      <p>
        <strong>Monthly fee:</strong> {formatMoney(voucher.amount_due)}
      </p>
      {Number(voucher.amount_paid) > 0 && (
        <p>
          <strong>Already paid:</strong> {formatMoney(voucher.amount_paid)}
        </p>
      )}
      <p style={{ fontSize: '1.1rem' }}>
        <strong>Amount payable:</strong> {formatMoney(balance)}
      </p>
      <p style={{ marginTop: '2rem', fontSize: '0.85rem', color: '#555' }}>
        Deposit fee at the school office and retain this challan as proof of billing.
      </p>
    </div>
  );
}