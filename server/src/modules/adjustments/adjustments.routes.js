import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../../infrastructure/supabase.client.js';
import { requireRole } from '../../middleware/auth.middleware.js';
import { logAudit } from '../../shared/audit.service.js';
import { asyncHandler } from '../../middleware/async.middleware.js';

const router = Router();

const createSchema = z.object({
  voucher_id: z.string().uuid(),
  amount: z.number().positive(),
  adjustment_type: z.enum(['credit', 'refund', 'waiver']),
  reason: z.string().min(3).max(500),
});

router.get(
  '/',
  requireRole('admin'),
  asyncHandler(async (_req, res) => {
    const { data, error } = await supabase
      .from('fee_adjustments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    res.json(data ?? []);
  })
);

router.post(
  '/',
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const body = createSchema.parse(req.body);

    const { data: voucher, error: vErr } = await supabase
      .from('fee_vouchers')
      .select('id, student_id, amount_due, amount_paid, late_fee_waived')
      .eq('id', body.voucher_id)
      .single();
    if (vErr) throw vErr;

    if (body.adjustment_type === 'waiver' && body.amount > 0) {
      await supabase
        .from('fee_vouchers')
        .update({ late_fee_waived: true })
        .eq('id', voucher.id);
    } else if (body.adjustment_type === 'credit' || body.adjustment_type === 'refund') {
      const credit = Math.min(Number(body.amount), Number(voucher.amount_paid));
      if (credit <= 0) {
        return res.status(400).json({ error: 'No collected amount to credit' });
      }
      const newPaid = Math.max(0, Number(voucher.amount_paid) - credit);
      await supabase
        .from('fee_vouchers')
        .update({ amount_paid: newPaid })
        .eq('id', voucher.id);
    }

    const { data: row, error } = await supabase
      .from('fee_adjustments')
      .insert({
        voucher_id: voucher.id,
        student_id: voucher.student_id,
        amount:
          body.adjustment_type === 'credit' || body.adjustment_type === 'refund'
            ? -body.amount
            : body.amount,
        adjustment_type: body.adjustment_type,
        reason: body.reason,
        recorded_by_user_id: req.user?.sub ?? null,
      })
      .select()
      .single();
    if (error) throw error;

    await logAudit(req, {
      action: 'adjustment',
      entityType: 'fee_vouchers',
      entityId: voucher.id,
      metadata: {
        adjustment_id: row.id,
        type: body.adjustment_type,
        amount: body.amount,
      },
    });

    res.status(201).json(row);
  })
);

export default router;
