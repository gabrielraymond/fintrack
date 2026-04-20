import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// Routes that don't require authentication
const publicRoutes = ['/login', '/register'];

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);

  const { pathname } = request.nextUrl;

  // Allow access to public auth routes without authentication
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return supabaseResponse;
  }

  // If user is not authenticated, redirect to login (Req 1.5)
  // Preserve the current URL for redirect after re-authentication (Req 29.3)
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    // On session refresh failure, indicate session expired (Req 29.2)
    url.searchParams.set('expired', 'true');
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder assets (images, svgs, etc.)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
