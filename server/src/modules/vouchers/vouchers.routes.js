import { Router } from 'express';
import { requireRole } from '../../middleware/auth.middleware.js';
import { logAudit } from '../../shared/audit.service.js';
import { asyncHandler } from '../../middleware/async.middleware.js';
import { generateVouchersSchema, recordPaymentSchema } from './vouchers.validation.js';
import {
  listVouchers,
  listVoucherPayments,
  getVoucherById,
  generateMonthlyVouchers,
  recordVoucherPayment,
} from './vouchers.service.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const rows = await listVouchers(req.query);
    res.json(rows);
  })
);

router.get(
  '/:id/payments',
  asyncHandler(async (req, res) => {
    const data = await listVoucherPayments(req.params.id);
    res.json(data);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = await getVoucherById(req.params.id);
    res.json(data);
  })
);

router.post(
  '/generate',
  requireRole('admin', 'accountant'),
  asyncHandler(async (req, res) => {
    const { year, month } = generateVouchersSchema.parse(req.body ?? {});
    const result = await generateMonthlyVouchers({ year, month });
    await logAudit(req, {
      action: 'voucher.generate',
      entityType: 'fee_voucher',
      metadata: {
        billing_year: result.billing_year,
        billing_month: result.billing_month,
        created: result.created,
      },
    });
    res.status(201).json(result);
  })
);

router.post(
  '/:id/payments',
  requireRole('admin', 'accountant'),
  asyncHandler(async (req, res) => {
    const body = recordPaymentSchema.parse(req.body);
    const { payment, voucher, auditMeta } = await recordVoucherPayment(
      req.params.id,
      body,
      req.user?.sub
    );
    await logAudit(req, {
      action: 'payment.record',
      entityType: 'payment',
      entityId: payment.id,
      metadata: auditMeta,
    });
    res.status(201).json({ payment, voucher });
  })
);

export default router;
