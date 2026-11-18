import { PAYMENT_METHODS } from '../constants/paymentMethods.js';
import { formatMoney } from '../api.js';

export default function PaymentEntryForm({
  studentName,
  amountDue,
  amountPaid,
  form,
  onChange,
  onSubmit,
  onCancel,
  saving,
  error,
}) {
  const remaining = Number(amountDue) - Number(amountPaid);

  const setFullAmount = () => {
    onChange({ ...form, amount: String(remaining) });
  };

  return (
    <form className="form-grid payment-entry" onSubmit={onSubmit}>
      <p className="payment-entry-hint">
        Receipt number is generated automatically when you save. Voucher status becomes{' '}
        <strong>paid</strong> when the full fee is collected.
      </p>
      {error && <p className="error">{error}</p>}
      <label>
        Amount (PKR)
        <div className="amount-row">
          <input
            type="number"
            min="1"
            step="1"
            required
            value={form.amount}
            onChange={(e) => onChange({ ...form, amount: e.target.value })}
          />
          <button type="button" className="btn secondary small" onClick={setFullAmount}>
            Pay full ({formatMoney(remaining)})
          </button>
        </div>
      </label>
      <label>
        Payment method
        <select
          value={form.payment_method}
          onChange={(e) => onChange({ ...form, payment_method: e.target.value })}
          required
        >
          {PAYMENT_METHODS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Payment date
        <input
          type="date"
          required
          value={form.payment_date}
          onChange={(e) => onChange({ ...form, payment_date: e.target.value })}
        />
      </label>
      <div className="toolbar">
        <button type="submit" className="btn" disabled={saving}>
          {saving ? 'Recording…' : 'Record payment'}
        </button>
        {onCancel && (
          <button type="button" className="btn secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}