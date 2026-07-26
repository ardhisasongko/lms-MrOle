import { supabase } from '../services/supabase';

export async function logAdmin(action, table, recordId, details) {
  await supabase.rpc('log_admin_action', { p_action: action, p_table_name: table, p_record_id: recordId, p_details: details }).catch((err) => console.warn('logAdmin failed:', err));
}
