import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/dashboard')) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  if (pathname === '/login' || pathname === '/register') {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
};
