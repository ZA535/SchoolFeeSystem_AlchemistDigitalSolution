import { Router } from 'express';
import { supabase } from '../../infrastructure/supabase.client.js';
import { currentBillingPeriod } from '../../shared/voucher.util.js';
import { syncVoucherStatuses } from '../../shared/voucher-status.service.js';

const router = Router();

router.get('/summary', async (req, res, next) => {
  try {
    const { year, month } = req.query;
    const period = currentBillingPeriod();
    const billingYear = year ? Number(year) : period.year;
    const billingMonth = month ? Number(month) : period.month;

    await syncVoucherStatuses();

    const { data: vouchers, error } = await supabase
      .from('fee_vouchers')
      .select('amount_due, amount_paid, status, student_id')
      .eq('billing_year', billingYear)
      .eq('billing_month', billingMonth);
    if (error) throw error;

    const rows = vouchers ?? [];
    let totalExpected = 0;
    let totalCollected = 0;
    let totalPending = 0;
    let defaultersCount = 0;

    for (const v of rows) {
      const due = Number(v.amount_due);
      const paid = Number(v.amount_paid);
      totalExpected += due;
      totalCollected += paid;
      const remaining = due - paid;
      if (remaining > 0.001) {
        totalPending += remaining;
        if (v.status === 'overdue') defaultersCount += 1;
      }
    }

    const { count: studentCount } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true });

    res.json({
      billing_year: billingYear,
      billing_month: billingMonth,
      voucher_count: rows.length,
      student_count: studentCount ?? 0,
      total_expected: round2(totalExpected),
      total_collected: round2(totalCollected),
      total_pending: round2(totalPending),
      defaulters_count: defaultersCount,
    });
  } catch (e) {
    next(e);
  }
});

function round2(n) {
  return Math.round(n * 100) / 100;
}

export default router;
