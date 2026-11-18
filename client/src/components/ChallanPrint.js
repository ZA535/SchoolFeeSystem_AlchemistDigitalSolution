import { formatMoney, monthLabel } from '../api.js';
import { DefaultAppName } from '../enums/defaults.js';

function ChallanCopy({ title, voucher, schoolName, student, balance }) {
  return (
    <div className="challan-copy">
      <p className="challan-copy__label">{title}</p>
      <h2 className="challan-copy__school">{schoolName}</h2>
      <p className="challan-copy__title">Monthly Fee Challan</p>
      <p>
        <strong>Ref:</strong> {voucher.id.slice(0, 8).toUpperCase()}
      </p>
      <p>
        <strong>Period:</strong>{' '}
        {monthLabel(voucher.billing_year, voucher.billing_month)}
      </p>
      <p>
        <strong>Due date:</strong> {voucher.due_date}
      </p>
      <hr />
      <p>
        <strong>Student:</strong> {student?.full_name}
      </p>
      <p>
        <strong>Roll / Class:</strong> {student?.roll_number} · {student?.class_section}
      </p>
      <p>
        <strong>Guardian:</strong> {student?.guardian_contact}
      </p>
      <p>
        <strong>Fee due:</strong> {formatMoney(voucher.amount_due)}
      </p>
      {Number(voucher.amount_paid) > 0 && (
        <p>
          <strong>Paid:</strong> {formatMoney(voucher.amount_paid)}
        </p>
      )}
      {Number(voucher.late_fee_applied) > 0 && (
        <p>
          <strong>Late fee:</strong> {formatMoney(voucher.late_fee_applied)}
        </p>
      )}
      <p className="challan-copy__amount">
        <strong>Payable:</strong> {formatMoney(balance)}
      </p>
      <p className="challan-copy__footer">Authorized signature: _______________</p>
    </div>
  );
}

export default function ChallanPrint({
  voucher,
  schoolName = DefaultAppName.YOUR_SCHOOL_NAME,
}) {
  const student = voucher.student;
  const balance = Number(voucher.amount_due) - Number(voucher.amount_paid);

  return (
    <div className="print-challan-a4">
      <ChallanCopy
        title="Bank copy"
        voucher={voucher}
        schoolName={schoolName}
        student={student}
        balance={balance}
      />
      <ChallanCopy
        title="School copy"
        voucher={voucher}
        schoolName={schoolName}
        student={student}
        balance={balance}
      />
      <ChallanCopy
        title="Student copy"
        voucher={voucher}
        schoolName={schoolName}
        student={student}
        balance={balance}
      />
    </div>
  );
}
