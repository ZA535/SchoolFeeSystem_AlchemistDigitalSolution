import { supabase } from '../infrastructure/supabase.client.js';

export async function logAudit(req, { action, entityType, entityId, metadata = {} }) {
  try {
    const entityIdStr = entityId ? String(entityId) : null;
    const row = {
      user_id: req.user?.sub ?? null,
      user_email: req.user?.email ?? null,
      action,
      entity_type: entityType,
      entity_id: entityIdStr,
      table_name: entityType,
      record_id: entityIdStr,
      metadata,
      ip_address:
        req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.socket?.remoteAddress ||
        null,
    };
    await supabase.from('audit_logs').insert(row);
  } catch (err) {
    console.warn('[audit]', err.message);
  }
}
