import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { supabase } from '../../infrastructure/supabase.client.js';
import { logAudit } from '../../shared/audit.service.js';
import { requireAuth, signToken } from '../../middleware/auth.middleware.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const { data: user, error } = await supabase
      .from('app_users')
      .select('id, email, password_hash, full_name, role, is_active')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (error) throw error;
    if (!user?.is_active) {
      return res.status(401).json({ error: 'Account is disabled' });
    }
    const ok = user && (await bcrypt.compare(password, user.password_hash));
    if (!ok) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    await supabase
      .from('app_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);

    const token = signToken(user);
    const profile = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
    };

    req.user = { sub: user.id, email: user.email, role: user.role };
    await logAudit(req, {
      action: 'login',
      entityType: 'app_user',
      entityId: user.id,
    });

    res.json({ token, user: profile });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid login payload' });
    }
    next(e);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const { data: user, error } = await supabase
      .from('app_users')
      .select('id, email, full_name, role, is_active, last_login_at')
      .eq('id', req.user.sub)
      .single();
    if (error) throw error;
    if (!user?.is_active) {
      return res.status(401).json({ error: 'Account is disabled' });
    }
    res.json({ user });
  } catch (e) {
    next(e);
  }
});

export default router;
