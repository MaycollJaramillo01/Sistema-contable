import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          response.cookies.set({ name, value: '', ...options });
        }
      }
    }
  );

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/forgot');
  const isPublic = pathname.startsWith('/_next') || pathname.startsWith('/public') || pathname.startsWith('/api');

  if (!user && !isAuthRoute && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (user && pathname.startsWith('/app')) {
    const orgId = request.cookies.get('org_id')?.value;
    if (!orgId && !pathname.startsWith('/app/select-org')) {
      const url = request.nextUrl.clone();
      url.pathname = '/app/select-org';
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ['/app/:path*', '/login', '/register', '/forgot']
};
