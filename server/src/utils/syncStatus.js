import { supabase } from '../supabase.js';

export async function syncVoucherStatuses() {
  try {
    const { error } = await supabase.rpc('sync_voucher_statuses');
    if (error) {
      console.warn('[syncVoucherStatuses]', error.message);
    }
  } catch (err) {
    console.warn('[syncVoucherStatuses]', err?.message || err);
  }
}