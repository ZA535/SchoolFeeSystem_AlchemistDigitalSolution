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
