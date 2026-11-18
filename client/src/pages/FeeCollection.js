import { useEffect, useState } from 'react';
import { api, formatMoney, monthLabel } from '../api.js';
import { paymentMethodLabel } from '../constants/paymentMethods.js';
import PaymentEntryForm from '../components/PaymentEntryForm.js';
import PaymentSuccessBanner from '../components/PaymentSuccessBanner.js';
import PageHeader from '../components/PageHeader.js';
import TableSkeleton from '../components/TableSkeleton.js';
import TablePagination from '../components/TablePagination.js';
import InlineFormCard from '../components/InlineFormCard.js';
import { usePagination } from '../hooks/usePagination.js';
import { useToast } from '../components/ToastProvider.js';

const emptyPayForm = () => ({
  amount: '',
  payment_method: 'cash',
  payment_date: new Date().toISOString().slice(0, 10),
});

export default function FeeCollection() {
  const { toast } = useToast();
  const now = new Date();
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [classSection, setClassSection] = useState('');
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [payForm, setPayForm] = useState(emptyPayForm());
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');
  const [lastSuccess, setLastSuccess] = useState(null);

  const load = ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError('');
    return api
      .getVouchers({
        year,
        month,
        class_section: classSection || undefined,
        unpaid: 'true',
      })
      .then(setVouchers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [year, month, classSection]);

  const classOptions = [
    ...new Set(vouchers.map((v) => v.student?.class_section).filter(Boolean)),
  ].sort();

  const pagination = usePagination(vouchers, undefined, [year, month, classSection]);

  const selectVoucher = (v) => {
    const remaining = Number(v.amount_due) - Number(v.amount_paid);
    setSelected(v);
    setPayForm({
      ...emptyPayForm(),
      amount: String(remaining),
    });
    setPayError('');
  };

  const closePayment = () => {
    setSelected(null);
    setPayError('');
  };

  const submitPayment = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setPaying(true);
    setPayError('');
    try {
      const { payment, voucher } = await api.recordPayment(selected.id, {
        amount: Number(payForm.amount),
        payment_method: payForm.payment_method,
        payment_date: payForm.payment_date,
      });
      setLastSuccess({
        payment,
        voucher,
        studentName: selected.student?.full_name,
      });
      closePayment();
      await load({ silent: true });
      toast(
        voucher.status === 'paid'
          ? `Payment recorded — voucher fully paid (receipt ${payment.receipt_number}).`
          : `Partial payment saved — receipt ${payment.receipt_number}.`,
        { type: 'success' }
      );
    } catch (err) {
      setPayError(err.message);
      toast(err.message, { type: 'error' });
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="page">
      <PaymentSuccessBanner
        result={lastSuccess}
        onDismiss={() => setLastSuccess(null)}
      />

      <PageHeader
        title="Fee collection"
        description="Record cash, bank, or EasyPaisa/JazzCash payments. Receipt numbers are assigned automatically; vouchers mark paid when fully collected."
      />

      {selected ? (
        <InlineFormCard
          open
          title={`Collect fee — ${selected.student?.full_name}`}
          onClose={closePayment}
          error={payError}
        >
          <p>
            <strong>{selected.student?.full_name}</strong> —{' '}
            {monthLabel(selected.billing_year, selected.billing_month)}
          </p>
          {selected.latest_payment && (
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
              Last payment: {formatMoney(selected.latest_payment.amount)} on{' '}
              {selected.latest_payment.payment_date} (
              {paymentMethodLabel(selected.latest_payment.payment_method)}) — receipt{' '}
              {selected.latest_payment.receipt_number}
            </p>
          )}
          <PaymentEntryForm
            amountDue={selected.amount_due}
            amountPaid={selected.amount_paid}
            form={payForm}
            onChange={setPayForm}
            onSubmit={submitPayment}
            onCancel={closePayment}
            saving={paying}
            error=""
          />
        </InlineFormCard>
      ) : (
        <div className="card card--elevated">
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
          </div>

          {error && <p className="error-banner">{error}</p>}

          {loading ? (
            <TableSkeleton rows={7} columns={6} />
          ) : vouchers.length === 0 ? (
            <p className="table-empty" style={{ padding: '1.5rem 0' }}>
              No unpaid vouchers for {monthLabel(Number(year), Number(month))}. Generate
              vouchers from the Dashboard or check Fee Vouchers.
            </p>
          ) : (
            <>
              <div className="table-wrap table-wrap--sticky">
                <table>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Roll</th>
                      <th>Class</th>
                      <th>Balance</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {pagination.pageItems.map((v) => {
                      const balance = Number(v.amount_due) - Number(v.amount_paid);
                      return (
                        <tr key={v.id}>
                          <td>{v.student?.full_name}</td>
                          <td>{v.student?.roll_number}</td>
                          <td>{v.student?.class_section}</td>
                          <td>{formatMoney(balance)}</td>
                          <td>
                            <span className={`badge ${v.status}`}>{v.status}</span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn small secondary"
                              onClick={() => selectVoucher(v)}
                            >
                              Collect fee
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <TablePagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalItems}
                startIndex={pagination.startIndex}
                endIndex={pagination.endIndex}
                onPageChange={pagination.setPage}
              />
            </>
          )}

          {!loading && vouchers.length > 0 && (
            <p className="card-footnote">Choose a student to open the payment form.</p>
          )}
        </div>
      )}
    </div>
  );
}