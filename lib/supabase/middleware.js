import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

const PUBLIC = ['/login', '/setup'];

function isPublic(path) {
  return PUBLIC.some(p => path === p || path.startsWith(p + '/')) ||
    path.startsWith('/_next') || path.startsWith('/api/auth');
}

/**
 * Menyegarkan sesi Supabase dan menjaga rute terproteksi.
 *
 * Middleware sengaja tidak pernah melempar. Bila variabel environment belum
 * terpasang atau Supabase tidak dapat dihubungi, permintaan diarahkan ke
 * /setup yang menjelaskan penyebabnya — jauh lebih berguna daripada
 * MIDDLEWARE_INVOCATION_FAILED yang tidak menyebut apa pun.
 */
export async function updateSession(request) {
  const path = request.nextUrl.pathname;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Konfigurasi belum lengkap → arahkan ke halaman diagnosis, bukan 500.
  if (!url || !key || !/^https?:\/\//.test(url)) {
    if (path === '/setup') return NextResponse.next({ request });
    const to = request.nextUrl.clone();
    to.pathname = '/setup';
    to.search = '';
    return NextResponse.redirect(to);
  }

  let response = NextResponse.next({ request });

  try {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(list) {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        }
      }
    });

    const { data: { user } } = await supabase.auth.getUser();

    if (!user && !isPublic(path)) {
      const to = request.nextUrl.clone();
      to.pathname = '/login';
      return NextResponse.redirect(to);
    }
    if (user && path === '/login') {
      const to = request.nextUrl.clone();
      to.pathname = '/dashboard';
      return NextResponse.redirect(to);
    }
    return response;
  } catch (e) {
    // Supabase tidak terjangkau atau kredensial ditolak. Halaman login tetap
    // dapat dibuka; rute lain diarahkan ke sana daripada menjatuhkan request.
    console.error('[middleware] Supabase session check failed:', e && e.message ? e.message : e);
    if (isPublic(path)) return NextResponse.next({ request });
    const to = request.nextUrl.clone();
    to.pathname = '/login';
    return NextResponse.redirect(to);
  }
}
