import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request) {
  return await updateSession(request);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo-tf.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']
};
