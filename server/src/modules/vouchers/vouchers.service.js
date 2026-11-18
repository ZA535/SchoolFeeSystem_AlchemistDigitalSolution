import { supabase } from '../../infrastructure/supabase.client.js';
import { withDbTimeout } from '../../infrastructure/supabase-timeout.js';
import { generateReceiptNumber } from '../../shared/receipt.util.js';
import {
  currentBillingPeriod,
  defaultDueDate,
} from '../../shared/voucher.util.js';
import { syncVoucherStatuses } from '../../shared/voucher-status.service.js';
import {
  assertSupabaseOk,
  assertSupabaseRow,
} from '../../shared/supabase-errors.js';
import { AppError } from '../../shared/app-error.js';

async function fetchStudentsForVouchers(studentIds) {
  if (!studentIds.length) return {};
  const result = await withDbTimeout(
    supabase
      .from('students')
      .select(
        'id, full_name, roll_number, class_section, guardian_contact, monthly_fee'
      )
      .in('id', studentIds),
    'students lookup'
  );
  assertSupabaseOk(result.error);
  return Object.fromEntries((result.data ?? []).map((s) => [s.id, s]));
}

async function attachPaymentsToVouchers(rows) {
  const voucherIds = rows.map((v) => v.id);
  if (!voucherIds.length) return rows;

  const result = await withDbTimeout(
    supabase
      .from('payments')
      .select('*')
      .in('voucher_id', voucherIds)
      .order('payment_date', { ascending: false })
      .order('created_at', { ascending: false }),
    'payments lookup'
  );
  assertSupabaseOk(result.error);

  const byVoucher = {};
  for (const p of result.data ?? []) {
    if (!byVoucher[p.voucher_id]) byVoucher[p.voucher_id] = [];
    byVoucher[p.voucher_id].push(p);
  }

  return rows.map((v) => {
    const payments = byVoucher[v.id] ?? [];
    return {
      ...v,
      payments,
      latest_payment: payments[0] ?? null,
    };
  });
}

export async function listVouchers(filters = {}) {
  await syncVoucherStatuses();

  const { class_section, status, year, month, unpaid } = filters;
  let query = supabase
    .from('fee_vouchers')
    .select('*')
    .order('created_at', { ascending: false });

  if (year) query = query.eq('billing_year', Number(year));
  if (month) query = query.eq('billing_month', Number(month));
  if (status) query = query.eq('status', status);
  if (unpaid === 'true' || unpaid === true) {
    query = query.in('status', ['pending', 'overdue']);
  }

  const { data: vouchers, error } = await withDbTimeout(query, 'vouchers list');
  assertSupabaseOk(error);

  let rows = vouchers ?? [];
  const studentIds = [...new Set(rows.map((v) => v.student_id).filter(Boolean))];
  const studentMap = await fetchStudentsForVouchers(studentIds);

  rows = rows.map((v) => ({
    ...v,
    student: studentMap[v.student_id] ?? null,
  }));

  rows = await attachPaymentsToVouchers(rows);

  if (class_section) {
    rows = rows.filter((v) => v.student?.class_section === class_section);
  }

  return rows;
}

export async function listVoucherPayments(voucherId) {
  const { data, error } = await withDbTimeout(
    supabase
      .from('payments')
      .select('*')
      .eq('voucher_id', voucherId)
      .order('payment_date', { ascending: false }),
    'voucher payments'
  );
  assertSupabaseOk(error);
  return data ?? [];
}

export async function getVoucherById(voucherId) {
  const { data, error } = await withDbTimeout(
    supabase
      .from('fee_vouchers')
      .select(
        `
        *,
        student:students!fee_vouchers_student_id_fkey (*),
        payments!payments_voucher_id_fkey ( * )
      `
      )
      .eq('id', voucherId)
      .single(),
    'voucher detail'
  );
  assertSupabaseOk(error);
  return assertSupabaseRow(data, 'Voucher not found');
}

export async function generateMonthlyVouchers({ year, month } = {}) {
  const period = currentBillingPeriod();
  const billingYear = year ?? period.year;
  const billingMonth = month ?? period.month;

  const studentsResult = await withDbTimeout(
    supabase.from('students').select('id, monthly_fee').eq('is_active', true),
    'active students'
  );
  assertSupabaseOk(studentsResult.error);

  const students = studentsResult.data ?? [];
  const due_date = defaultDueDate(billingYear, billingMonth);
  const toInsert = students.map((s) => ({
    student_id: s.id,
    billing_year: billingYear,
    billing_month: billingMonth,
    amount_due: s.monthly_fee,
    amount_paid: 0,
    due_date,
  }));

  if (toInsert.length === 0) {
    return {
      created: 0,
      skipped: 0,
      billing_year: billingYear,
      billing_month: billingMonth,
    };
  }

  const upsertResult = await withDbTimeout(
    supabase
      .from('fee_vouchers')
      .upsert(toInsert, {
        onConflict: 'student_id,billing_year,billing_month',
        ignoreDuplicates: true,
      })
      .select(),
    'voucher generate'
  );
  assertSupabaseOk(upsertResult.error);

  const created = upsertResult.data ?? [];
  return {
    created: created.length,
    skipped: toInsert.length - created.length,
    billing_year: billingYear,
    billing_month: billingMonth,
  };
}

export async function recordVoucherPayment(voucherId, body, recordedByUserId) {
  const voucherResult = await withDbTimeout(
    supabase.from('fee_vouchers').select('*').eq('id', voucherId).single(),
    'voucher for payment'
  );
  assertSupabaseOk(voucherResult.error);
  const voucher = assertSupabaseRow(voucherResult.data, 'Voucher not found');

  const balance = Number(voucher.amount_due) - Number(voucher.amount_paid);
  if (body.amount > balance + 0.001) {
    throw new AppError(
      `Payment exceeds remaining balance (${balance.toFixed(2)})`,
      400
    );
  }

  const receipt_number = generateReceiptNumber();
  const payment_date = body.payment_date ?? new Date().toISOString().slice(0, 10);

  const paymentResult = await withDbTimeout(
    supabase
      .from('payments')
      .insert({
        voucher_id: voucherId,
        amount: body.amount,
        payment_date,
        payment_method: body.payment_method,
        receipt_number,
        recorded_by_user_id: recordedByUserId ?? null,
      })
      .select()
      .single(),
    'payment insert'
  );
  assertSupabaseOk(paymentResult.error);
  const payment = assertSupabaseRow(paymentResult.data);

  const newPaid = Number(voucher.amount_paid) + body.amount;
  const updatePayload = { amount_paid: newPaid };
  if (newPaid >= Number(voucher.amount_due)) {
    updatePayload.receipt_number = receipt_number;
  }

  const updatedResult = await withDbTimeout(
    supabase
      .from('fee_vouchers')
      .update(updatePayload)
      .eq('id', voucherId)
      .select('*')
      .single(),
    'voucher update after payment'
  );
  assertSupabaseOk(updatedResult.error);
  const updated = assertSupabaseRow(updatedResult.data);

  const studentResult = await withDbTimeout(
    supabase.from('students').select('*').eq('id', updated.student_id).maybeSingle(),
    'student after payment'
  );
  assertSupabaseOk(studentResult.error);

  const allPayments = await listVoucherPayments(voucherId);

  return {
    payment,
    voucher: {
      ...updated,
      student: studentResult.data ?? null,
      payments: allPayments,
      latest_payment: allPayments[0] ?? payment,
      marked_paid: updated.status === 'paid',
    },
    auditMeta: {
      voucher_id: voucherId,
      amount: body.amount,
      receipt_number,
      payment_method: body.payment_method,
    },
  };
}