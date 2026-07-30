import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

function getJwtRole(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    const json = JSON.parse(atob(padded));
    return json.role || null;
  } catch {
    return null;
  }
}

const keyRole = getJwtRole(supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] Missing environment variables. ' +
    'Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file. ' +
    'Authentication will not work until these are configured.'
  );
} else if (keyRole === 'service_role') {
  console.error(
    '[Supabase] VITE_SUPABASE_ANON_KEY is a service_role key. ' +
    'Replace it with the public anon key from Supabase Dashboard → Project Settings → API. ' +
    'Never expose the service_role key in the frontend.'
  );
}

// Create the client — uses placeholder values if env vars are missing.
// Auth calls will fail gracefully with error messages in the UI.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

export const isSupabaseConfigured =
  Boolean(supabaseUrl && supabaseAnonKey) && keyRole !== 'service_role';
