import { Router } from 'express';
import { requireRole } from '../../middleware/auth.middleware.js';
import { logAudit } from '../../shared/audit.service.js';
import { getSchoolSettings, updateSchoolSettings } from '../../shared/late-fee.service.js';
import { asyncHandler } from '../../middleware/async.middleware.js';

const router = Router();

router.get('/fee-rules', asyncHandler(async (_req, res) => {
  const settings = await getSchoolSettings();
  res.json(settings);
}));

router.patch('/fee-rules', requireRole('admin'), asyncHandler(async (req, res) => {
  const { late_fee_flat, late_fee_enabled } = req.body ?? {};
  const patch = {};
  if (late_fee_flat !== undefined) patch.late_fee_flat = Number(late_fee_flat);
  if (late_fee_enabled !== undefined) patch.late_fee_enabled = Boolean(late_fee_enabled);
  const settings = await updateSchoolSettings(patch);
  await logAudit(req, {
    action: 'update',
    entityType: 'school_settings',
    entityId: '1',
    metadata: patch,
  });
  res.json(settings);
}));

export default router;