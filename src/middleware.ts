import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession, decrypt } from '@/lib/session';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Define public routes
  const isPublicRoute = path === '/login' || path === '/' || path.startsWith('/api/auth');

  // Verify session safely via request.cookies instead of next/headers
  const cookie = request.cookies.get('sliit_share_session')?.value;
  const session = await decrypt(cookie);

  if (!session?.userId && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.nextUrl));
  }

  if (session?.userId && (path === '/login' || path === '/')) {
    return NextResponse.redirect(new URL('/dashboard', request.nextUrl));
  }

  const response = NextResponse.next();

  // Extend session expiry
  if (session?.userId && !isPublicRoute) {
    await updateSession(request, response);
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
