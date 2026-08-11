import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/** Client Supabase untuk Server Component, Server Action, dan Route Handler. */
export function createClient() {
  const store = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return store.getAll(); },
        setAll(list) {
          try { list.forEach(({ name, value, options }) => store.set(name, value, options)); }
          catch { /* dipanggil dari Server Component: diabaikan, middleware yang menyegarkan sesi */ }
        }
      }
    }
  );
}

/** Client service-role. HANYA untuk route handler admin dan skrip seed. */
export function createAdminClient() {
  const { createClient: createRaw } = require('@supabase/supabase-js');
  return createRaw(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
