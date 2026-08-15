import { createServerClient } from '@supabase/ssr';
import { createClient as createRawClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

function need(name) {
  const v = process.env[name];
  if (!v) throw new Error('Environment variable ' + name + ' belum diset. Lihat /setup.');
  return v;
}

/** Client Supabase untuk Server Component, Server Action, dan Route Handler. */
export function createClient() {
  const store = cookies();
  return createServerClient(
    need('NEXT_PUBLIC_SUPABASE_URL'),
    need('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
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
  return createRawClient(
    need('NEXT_PUBLIC_SUPABASE_URL'),
    need('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
