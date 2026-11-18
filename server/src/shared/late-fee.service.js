import { supabase } from '../infrastructure/supabase.client.js';

export async function getSchoolSettings() {
  const { data, error } = await supabase
    .from('school_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  return (
    data ?? {
      id: 1,
      late_fee_flat: 0,
      late_fee_enabled: false,
    }
  );
}

export async function updateSchoolSettings(patch) {
  const { data, error } = await supabase
    .from('school_settings')
    .upsert({ id: 1, ...patch, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data;
}
