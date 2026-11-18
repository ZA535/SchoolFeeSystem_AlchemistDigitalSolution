import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, formatMoney, monthLabel } from '../api.js';
import { paymentMethodLabel } from '../constants/paymentMethods.js';
import PaymentEntryForm from '../components/PaymentEntryForm.js';
import PaymentSuccessBanner from '../components/PaymentSuccessBanner.js';
import { useAuth } from '../auth/AuthContext.js';

export default function Vouchers() {
  const { canCollect } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [classSection, setClassSection] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [unpaidOnly, setUnpaidOnly] = useState(false);
  const [vouchers, setVouchers] = useState([]);
  const [error, setError] = useState('');
  const [payModal, setPayModal] = useState(null);
  const [payForm, setPayForm] = useState({
    amount: '',
    payment_method: 'cash',
    payment_date: new Date().toISOString().slice(0, 10),
  });
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');
  const [lastSuccess, setLastSuccess] = useState(null);

  const load = () => {
    const params = {
      year,
      month,
      class_section: classSection || undefined,
      status: statusFilter || undefined,
      unpaid: unpaidOnly ? 'true' : undefined,
    };
    api
      .getVouchers(params)
      .then(setVouchers)
      .catch((e) => setError(e.message));
  };

  useEffect(() => {
    load();
  }, [year, month, classSection, statusFilter, unpaidOnly]);

  const classOptions = [
    ...new Set(vouchers.map((v) => v.student?.class_section).filter(Boolean)),
  ].sort();

  const openPay = (v) => {
    const remaining = Number(v.amount_due) - Number(v.amount_paid);
    setPayModal(v);
    setPayForm({
      amount: String(remaining),
      payment_method: 'cash',
      payment_date: new Date().toISOString().slice(0, 10),
    });
    setPayError('');
  };

  const submitPayment = async (e) => {
    e.preventDefault();
    if (!payModal) return;
    setPaying(true);
    setPayError('');
    try {
      const { payment, voucher } = await api.recordPayment(payModal.id, {
        amount: Number(payForm.amount),
        payment_method: payForm.payment_method,
        payment_date: payForm.payment_date,
      });
      setLastSuccess({
        payment,
        voucher,
        studentName: payModal.student?.full_name,
      });
      setPayModal(null);
      load();
    } catch (err) {
      setPayError(err.message);
    } finally {
      setPaying(false);
    }
  };

  return (
    <>
      <PaymentSuccessBanner
        result={lastSuccess}
        onDismiss={() => setLastSuccess(null)}
      />

      <div className="card">
        <h2>Fee vouchers — {monthLabel(Number(year), Number(month))}</h2>
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
          <label>
            Class / Section
            <select
              value={classSection}
              onChange={(e) => setClassSection(e.target.value)}
            >
              <option value="">All</option>
              {classOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label>
            Payment status
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
          </label>
          <label style={{ flexDirection: 'row', alignItems: 'center', gap: '0.4rem' }}>
            <input
              type="checkbox"
              checked={unpaidOnly}
              onChange={(e) => setUnpaidOnly(e.target.checked)}
            />
            Unpaid only
          </label>
        </div>
        {error && !payModal && <p className="error">{error}</p>}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Roll</th>
                <th>Class</th>
                <th>Due</th>
                <th>Paid</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Last receipt</th>
                <th>Last payment</th>
                <th>Due date</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {vouchers.map((v) => {
                const balance = Number(v.amount_due) - Number(v.amount_paid);
                const lp = v.latest_payment;
                return (
                  <tr key={v.id}>
                    <td>{v.student?.full_name}</td>
                    <td>{v.student?.roll_number}</td>
                    <td>{v.student?.class_section}</td>
                    <td>{formatMoney(v.amount_due)}</td>
                    <td>{formatMoney(v.amount_paid)}</td>
                    <td>{formatMoney(balance)}</td>
                    <td>
                      <span className={`badge ${v.status}`}>{v.status}</span>
                    </td>
                    <td className="mono">
                      {lp?.receipt_number || v.receipt_number || '—'}
                    </td>
                    <td>
                      {lp ? (
                        <>
                          {lp.payment_date}
                          <br />
                          <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                            {paymentMethodLabel(lp.payment_method)}
                          </span>
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>{v.due_date}</td>
                    <td>
                      {balance > 0.01 && canCollect && (
                        <>
                          <button
                            type="button"
                            className="btn small"
                            onClick={() => openPay(v)}
                          >
                            Record payment
                          </button>
                          <Link
                            to={`/challan/${v.id}`}
                            className="btn small secondary"
                            style={{ marginLeft: '0.35rem' }}
                          >
                            Challan
                          </Link>
                        </>
                      )}
                      {Number(v.amount_paid) > 0 && (
                        <Link
                          to={`/receipt/${v.id}`}
                          className="btn small secondary"
                          style={{ marginLeft: '0.35rem' }}
                        >
                          Receipt
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
              {vouchers.length === 0 && (
                <tr>
                  <td colSpan={11} style={{ color: 'var(--muted)' }}>
                    No vouchers for this period. Generate them from the Dashboard.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {payModal && canCollect && (
        <div className="card" style={{ borderColor: 'var(--primary)' }}>
          <h3>Record payment — {payModal.student?.full_name}</h3>
          <PaymentEntryForm
            amountDue={payModal.amount_due}
            amountPaid={payModal.amount_paid}
            form={payForm}
            onChange={setPayForm}
            onSubmit={submitPayment}
            onCancel={() => setPayModal(null)}
            saving={paying}
            error={payError}
          />
        </div>
      )}
    </>
  );
}
