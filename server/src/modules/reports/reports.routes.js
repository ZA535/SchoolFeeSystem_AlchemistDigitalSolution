import { Router } from 'express';
import { supabase } from '../../infrastructure/supabase.client.js';
import { syncVoucherStatuses } from '../../shared/voucher-status.service.js';
import { currentBillingPeriod } from '../../shared/voucher.util.js';
import { requireRole } from '../../middleware/auth.middleware.js';

const router = Router();

router.get('/defaulters', async (req, res, next) => {
  try {
    await syncVoucherStatuses();
    const period = currentBillingPeriod();
    const year = req.query.year ? Number(req.query.year) : period.year;
    const month = req.query.month ? Number(req.query.month) : period.month;

    const { data: vouchers, error } = await supabase
      .from('fee_vouchers')
      .select('*')
      .eq('billing_year', year)
      .eq('billing_month', month)
      .eq('status', 'overdue');
    if (error) throw error;

    const studentIds = [...new Set((vouchers ?? []).map((v) => v.student_id))];
    let studentMap = {};
    if (studentIds.length) {
      const { data: students } = await supabase
        .from('students')
        .select('id, full_name, roll_number, class_section, guardian_contact')
        .in('id', studentIds);
      studentMap = Object.fromEntries((students ?? []).map((s) => [s.id, s]));
    }

    const rows = (vouchers ?? []).map((v) => ({
      ...v,
      student: studentMap[v.student_id] ?? null,
      balance: Number(v.amount_due) - Number(v.amount_paid),
    }));

    res.json({
      billing_year: year,
      billing_month: month,
      count: rows.length,
      defaulters: rows,
    });
  } catch (e) {
    next(e);
  }
});

router.get('/daily-collection', async (req, res, next) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);

    const { data: payments, error } = await supabase
      .from('payments')
      .select('amount, payment_method, receipt_number, payment_date, voucher_id')
      .eq('payment_date', date)
      .order('created_at', { ascending: false });
    if (error) throw error;

    let total = 0;
    const byMethod = {};
    for (const p of payments ?? []) {
      const amt = Number(p.amount);
      total += amt;
      byMethod[p.payment_method] = (byMethod[p.payment_method] || 0) + amt;
    }

    res.json({
      date,
      payment_count: payments?.length ?? 0,
      total_collected: Math.round(total * 100) / 100,
      by_method: byMethod,
      payments: payments ?? [],
    });
  } catch (e) {
    next(e);
  }
});

router.get('/monthly-summary', async (req, res, next) => {
  try {
    await syncVoucherStatuses();
    const period = currentBillingPeriod();
    const year = req.query.year ? Number(req.query.year) : period.year;
    const month = req.query.month ? Number(req.query.month) : period.month;

    const { data: vouchers, error } = await supabase
      .from('fee_vouchers')
      .select('amount_due, amount_paid, status, student_id')
      .eq('billing_year', year)
      .eq('billing_month', month);
    if (error) throw error;

    let expected = 0;
    let collected = 0;
    for (const v of vouchers ?? []) {
      expected += Number(v.amount_due);
      collected += Number(v.amount_paid);
    }
    const pending = Math.max(0, expected - collected);

    res.json({
      billing_year: year,
      billing_month: month,
      total_revenue: Math.round(collected * 100) / 100,
      total_pending: Math.round(pending * 100) / 100,
      total_expected: Math.round(expected * 100) / 100,
      collection_rate_pct: expected > 0 ? Math.round((collected / expected) * 100) : 0,
    });
  } catch (e) {
    next(e);
  }
});

router.get('/defaulters-by-class', async (req, res, next) => {
  try {
    await syncVoucherStatuses();
    const period = currentBillingPeriod();
    const year = req.query.year ? Number(req.query.year) : period.year;
    const month = req.query.month ? Number(req.query.month) : period.month;

    const { data: vouchers, error } = await supabase
      .from('fee_vouchers')
      .select('student_id, amount_due, amount_paid, status')
      .eq('billing_year', year)
      .eq('billing_month', month)
      .neq('status', 'paid');
    if (error) throw error;

    const studentIds = [...new Set((vouchers ?? []).map((v) => v.student_id))];
    let studentMap = {};
    if (studentIds.length) {
      const { data: students } = await supabase
        .from('students')
        .select('id, class_section')
        .in('id', studentIds);
      studentMap = Object.fromEntries((students ?? []).map((s) => [s.id, s]));
    }

    const byClass = {};
    for (const v of vouchers ?? []) {
      const balance = Number(v.amount_due) - Number(v.amount_paid);
      if (balance <= 0.001) continue;
      if (v.status !== 'overdue' && v.status !== 'partial' && v.status !== 'pending')
        continue;
      const cls = studentMap[v.student_id]?.class_section ?? 'Unknown';
      if (!byClass[cls])
        byClass[cls] = { class_section: cls, defaulter_count: 0, balance_due: 0 };
      byClass[cls].defaulter_count += 1;
      byClass[cls].balance_due += balance;
    }

    const rows = Object.values(byClass)
      .map((r) => ({ ...r, balance_due: Math.round(r.balance_due * 100) / 100 }))
      .sort((a, b) => a.class_section.localeCompare(b.class_section));

    res.json({ billing_year: year, billing_month: month, classes: rows });
  } catch (e) {
    next(e);
  }
});

router.get('/audit', requireRole('admin'), async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    res.json(data ?? []);
  } catch (e) {
    next(e);
  }
});

export default router;
