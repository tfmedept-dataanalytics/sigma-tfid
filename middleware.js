import { NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request) {
  try {
    return await updateSession(request);
  } catch (e) {
    // Lapis pengaman terakhir: middleware yang melempar menghasilkan
    // MIDDLEWARE_INVOCATION_FAILED (HTTP 500) dan seluruh situs mati.
    // Lebih baik meneruskan permintaan dan membiarkan halaman menangani sesi.
    console.error('[middleware] unhandled error:', e && e.message ? e.message : e);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo-tf.png|fonts/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?|ttf)$).*)']
};
