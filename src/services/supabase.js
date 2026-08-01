import { createClient } from '@supabase/supabase-js';

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const isDemo = import.meta.env.VITE_DEMO === 'true';

if ((!supabaseUrl || !supabaseAnonKey) && !isDemo && typeof window !== 'undefined') {
  try {
    const response = await fetch('/api/config');
    if (response.ok) {
      ({ supabaseUrl, supabaseAnonKey } = await response.json());
    }
  } catch {
    // The configuration check below provides the actionable error.
  }
}

if (!supabaseUrl || !supabaseAnonKey) {
  if (isDemo) {
    console.warn('Demo mode: Supabase credentials not configured.');
  } else {
    throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be configured in production. Set VITE_DEMO=true for demo mode.');
  }
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);
