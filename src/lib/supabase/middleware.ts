import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          // Set cookies on the request for downstream server components
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );

          // Create a new response that carries the updated request cookies
          supabaseResponse = NextResponse.next({
            request,
          });

          // Set cookies on the response so the browser stores them
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );

          // Apply cache-control headers from the library
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value)
          );
        },
      },
    }
  );

  // Refresh the session — this triggers token refresh if needed (Req 29.1)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabaseResponse, user };
}
