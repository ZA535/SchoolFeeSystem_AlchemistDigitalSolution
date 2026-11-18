import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../../infrastructure/supabase.client.js';
import { requireRole } from '../../middleware/auth.middleware.js';
import { logAudit } from '../../shared/audit.service.js';

const router = Router();

const studentSchema = z.object({
  full_name: z.string().min(1),
  roll_number: z.string().min(1),
  class_section: z.string().min(1),
  monthly_fee: z.coerce.number().nonnegative(),
  guardian_contact: z.string().min(1),
});

router.get('/', async (req, res, next) => {
  try {
    const { class_section, q, include_inactive } = req.query;
    let query = supabase.from('students').select('*').order('full_name');
    if (include_inactive !== 'true') {
      query = query.eq('is_active', true);
    }
    if (class_section) query = query.eq('class_section', class_section);
    if (q) {
      query = query.or(`full_name.ilike.%${q}%,roll_number.ilike.%${q}%`);
    }
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Student not found' });
    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.post('/', requireRole('admin', 'accountant'), async (req, res, next) => {
  try {
    const body = studentSchema.parse(req.body);
    const { data, error } = await supabase
      .from('students')
      .insert(body)
      .select()
      .single();
    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Roll number already exists' });
      }
      throw error;
    }
    await logAudit(req, {
      action: 'student.create',
      entityType: 'student',
      entityId: data.id,
      metadata: { roll_number: data.roll_number },
    });
    res.status(201).json(data);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: e.flatten() });
    }
    next(e);
  }
});

router.put('/:id', requireRole('admin', 'accountant'), async (req, res, next) => {
  try {
    const body = studentSchema.parse(req.body);
    const { data, error } = await supabase
      .from('students')
      .update(body)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Student not found' });
    await logAudit(req, {
      action: 'student.update',
      entityType: 'student',
      entityId: data.id,
    });
    res.json(data);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: e.flatten() });
    }
    next(e);
  }
});

router.patch('/:id/deactivate', requireRole('admin'), async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .update({ is_active: false })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    await logAudit(req, {
      action: 'student.deactivate',
      entityType: 'student',
      entityId: data.id,
    });
    res.json(data);
  } catch (e) {
    next(e);
  }
});

export default router;
