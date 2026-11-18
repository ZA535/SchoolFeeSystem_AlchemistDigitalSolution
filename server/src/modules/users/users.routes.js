import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { supabase } from '../../infrastructure/supabase.client.js';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import { logAudit } from '../../shared/audit.service.js';

const router = Router();

router.use(requireAuth, requireRole('admin'));

router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('app_users')
      .select('id, email, full_name, role, is_active, last_login_at, created_at')
      .order('created_at');
    if (error) throw error;
    res.json(data);
  } catch (e) {
    next(e);
  }
});

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().min(1),
  role: z.enum(['admin', 'accountant', 'viewer']),
});

router.post('/', async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body);
    const hash = await bcrypt.hash(body.password, 12);
    const { data, error } = await supabase
      .from('app_users')
      .insert({
        email: body.email.toLowerCase(),
        password_hash: hash,
        full_name: body.full_name,
        role: body.role,
      })
      .select('id, email, full_name, role, is_active, created_at')
      .single();
    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Email already in use' });
      }
      throw error;
    }
    await logAudit(req, {
      action: 'user.create',
      entityType: 'app_user',
      entityId: data.id,
      metadata: { role: data.role, email: data.email },
    });
    res.status(201).json(data);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: e.flatten() });
    }
    next(e);
  }
});

const patchSchema = z.object({
  full_name: z.string().min(1).optional(),
  role: z.enum(['admin', 'accountant', 'viewer']).optional(),
  is_active: z.boolean().optional(),
  password: z.string().min(8).optional(),
});

router.patch('/:id', async (req, res, next) => {
  try {
    const body = patchSchema.parse(req.body);
    const updates = { ...body };
    if (body.password) {
      updates.password_hash = await bcrypt.hash(body.password, 12);
      delete updates.password;
    }
    if (updates.email) {
      updates.email = updates.email.toLowerCase();
    }
    const { data, error } = await supabase
      .from('app_users')
      .update(updates)
      .eq('id', req.params.id)
      .select('id, email, full_name, role, is_active, last_login_at')
      .single();
    if (error) throw error;
    await logAudit(req, {
      action: 'user.update',
      entityType: 'app_user',
      entityId: data.id,
      metadata: { role: data.role, is_active: data.is_active },
    });
    res.json(data);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: e.flatten() });
    }
    next(e);
  }
});

export default router;
