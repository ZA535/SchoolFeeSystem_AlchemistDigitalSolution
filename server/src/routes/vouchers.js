import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../supabase.js';
import { generateReceiptNumber } from '../utils/receipt.js';
import {
  currentBillingPeriod,
  defaultDueDate,
} from '../utils/voucher.js';
import { syncVoucherStatuses } from '../utils/syncStatus.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    await syncVoucherStatuses();
    const { class_section, status, year, month, unpaid } = req.query;
    let query = supabase
      .from('fee_vouchers')
      .select('*')
      .order('created_at', { ascending: false });

    if (year) query = query.eq('billing_year', Number(year));
    if (month) query = query.eq('billing_month', Number(month));
    if (status) query = query.eq('status', status);
    if (unpaid === 'true') {
      query = query.in('status', ['pending', 'overdue']);
    }

    const { data: vouchers, error } = await query;
    if (error) {
      const err = new Error(error.message);
      err.details = error;
      throw err;
    }

    let rows = vouchers ?? [];
    const studentIds = [...new Set(rows.map((v) => v.student_id).filter(Boolean))];
    let studentMap = {};
    if (studentIds.length > 0) {
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, full_name, roll_number, class_section, guardian_contact, monthly_fee')
        .in('id', studentIds);
      if (studentsError) {
        const err = new Error(studentsError.message);
        err.details = studentsError;
        throw err;
      }
      studentMap = Object.fromEntries((students ?? []).map((s) => [s.id, s]));
    }

    rows = rows.map((v) => ({
      ...v,
      student: studentMap[v.student_id] ?? null,
    }));

    const voucherIds = rows.map((v) => v.id);
    if (voucherIds.length > 0) {
      const { data: paymentRows, error: payListError } = await supabase
        .from('payments')
        .select('*')
        .in('voucher_id', voucherIds)
        .order('payment_date', { ascending: false })
        .order('created_at', { ascending: false });
      if (payListError) {
        const err = new Error(payListError.message);
        err.details = payListError;
        throw err;
      }
      const byVoucher = {};
      for (const p of paymentRows ?? []) {
        if (!byVoucher[p.voucher_id]) byVoucher[p.voucher_id] = [];
        byVoucher[p.voucher_id].push(p);
      }
      rows = rows.map((v) => {
        const payments = byVoucher[v.id] ?? [];
        return {
          ...v,
          payments,
          latest_payment: payments[0] ?? null,
        };
      });
    }

    if (class_section) {
      rows = rows.filter((v) => v.student?.class_section === class_section);
    }
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

router.get('/:id/payments', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('voucher_id', req.params.id)
      .order('payment_date', { ascending: false });
    if (error) throw error;
    res.json(data ?? []);
  } catch (e) {
    next(e);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('fee_vouchers')
      .select(
        `
        *,
        student:students!fee_vouchers_student_id_fkey (*),
        payments!payments_voucher_id_fkey ( * )
      `
      )
      .eq('id', req.params.id)
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Voucher not found' });
    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.post('/generate', async (req, res, next) => {
  try {
    const schema = z.object({
      year: z.coerce.number().int().optional(),
      month: z.coerce.number().int().min(1).max(12).optional(),
    });
    const { year, month } = schema.parse(req.body ?? {});
    const period = currentBillingPeriod();
    const billingYear = year ?? period.year;
    const billingMonth = month ?? period.month;

    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, monthly_fee');
    if (studentsError) throw studentsError;

    const due_date = defaultDueDate(billingYear, billingMonth);
    const toInsert = (students ?? []).map((s) => ({
      student_id: s.id,
      billing_year: billingYear,
      billing_month: billingMonth,
      amount_due: s.monthly_fee,
      amount_paid: 0,
      due_date,
    }));

    if (toInsert.length === 0) {
      return res.json({ created: 0, skipped: 0, billing_year: billingYear, billing_month: billingMonth });
    }

    const { data: created, error } = await supabase
      .from('fee_vouchers')
      .upsert(toInsert, {
        onConflict: 'student_id,billing_year,billing_month',
        ignoreDuplicates: true,
      })
      .select();

    if (error) throw error;

    res.status(201).json({
      created: created?.length ?? 0,
      skipped: toInsert.length - (created?.length ?? 0),
      billing_year: billingYear,
      billing_month: billingMonth,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: e.flatten() });
    }
    next(e);
  }
});

const paymentSchema = z.object({
  amount: z.coerce.number().positive(),
  payment_date: z.string().optional(),
  payment_method: z.enum(['cash', 'bank_transfer', 'easypaisa_jazzcash']),
});

router.post('/:id/payments', async (req, res, next) => {
  try {
    const body = paymentSchema.parse(req.body);
    const voucherId = req.params.id;

    const { data: voucher, error: vErr } = await supabase
      .from('fee_vouchers')
      .select('*')
      .eq('id', voucherId)
      .single();
    if (vErr) throw vErr;
    if (!voucher) return res.status(404).json({ error: 'Voucher not found' });

    const balance = Number(voucher.amount_due) - Number(voucher.amount_paid);
    if (body.amount > balance + 0.001) {
      return res.status(400).json({
        error: `Payment exceeds remaining balance (${balance.toFixed(2)})`,
      });
    }

    const receipt_number = generateReceiptNumber();
    const payment_date =
      body.payment_date ?? new Date().toISOString().slice(0, 10);

    const { data: payment, error: pErr } = await supabase
      .from('payments')
      .insert({
        voucher_id: voucherId,
        amount: body.amount,
        payment_date,
        payment_method: body.payment_method,
        receipt_number,
      })
      .select()
      .single();
    if (pErr) throw pErr;

    const newPaid = Number(voucher.amount_paid) + body.amount;
    const updatePayload = {
      amount_paid: newPaid,
    };
    if (newPaid >= Number(voucher.amount_due)) {
      updatePayload.receipt_number = receipt_number;
    }

    const { data: updated, error: uErr } = await supabase
      .from('fee_vouchers')
      .update(updatePayload)
      .eq('id', voucherId)
      .select('*')
      .single();
    if (uErr) throw uErr;

    const { data: student } = await supabase
      .from('students')
      .select('*')
      .eq('id', updated.student_id)
      .maybeSingle();

    const { data: allPayments } = await supabase
      .from('payments')
      .select('*')
      .eq('voucher_id', voucherId)
      .order('payment_date', { ascending: false });

    res.status(201).json({
      payment,
      voucher: {
        ...updated,
        student: student ?? null,
        payments: allPayments ?? [],
        latest_payment: (allPayments ?? [])[0] ?? payment,
        marked_paid: updated.status === 'paid',
      },
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: e.flatten() });
    }
    next(e);
  }
});

export default router;