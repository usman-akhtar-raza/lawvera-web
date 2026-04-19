import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_TOKEN_COOKIE_NAME } from '@/lib/auth/constants';

type AppRole = 'client' | 'lawyer' | 'admin';

const decodeJwtPayload = (
  token: string,
): { role?: string; exp?: number } | null => {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const decoded = atob(padded);
    return JSON.parse(decoded) as { role?: string; exp?: number };
  } catch {
    return null;
  }
};

const getDashboardForRole = (role: unknown): string | null => {
  if (role === 'admin') {
    return '/dashboard/admin';
  }
  if (role === 'lawyer') {
    return '/dashboard/lawyer';
  }
  if (role === 'client') {
    return '/dashboard/client';
  }
  return null;
};

const getRequiredRole = (pathname: string): AppRole | null => {
  if (pathname.startsWith('/dashboard/admin')) {
    return 'admin';
  }
  if (pathname.startsWith('/dashboard/lawyer')) {
    return 'lawyer';
  }
  if (pathname.startsWith('/dashboard/client')) {
    return 'client';
  }
  return null;
};

const buildLoginRedirect = (request: NextRequest) => {
  const redirectUrl = new URL('/auth/login', request.url);
  const redirectTarget = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  redirectUrl.searchParams.set('redirect', redirectTarget);
  return redirectUrl;
};

const redirectToLogin = (request: NextRequest, clearCookie = false) => {
  const response = NextResponse.redirect(buildLoginRedirect(request));
  if (clearCookie) {
    response.cookies.set(ACCESS_TOKEN_COOKIE_NAME, '', {
      path: '/',
      maxAge: 0,
    });
  }
  return response;
};

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtected = pathname.startsWith('/dashboard/') || pathname === '/profile';

  if (!isProtected) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value;
  if (!accessToken) {
    return redirectToLogin(request);
  }

  const payload = decodeJwtPayload(accessToken);
  if (!payload) {
    return redirectToLogin(request, true);
  }

  // Expired tokens are intentionally allowed through here.
  // The cookie is kept alive for 7 days (refresh token lifetime) so the
  // client-side axios interceptor can silently exchange the expired access
  // token for a fresh one on the first API call. Redirecting on expiry here
  // would beat the interceptor to it and send the user to login unnecessarily.

  if (pathname === '/profile') {
    return NextResponse.next();
  }

  const requiredRole = getRequiredRole(pathname);
  if (!requiredRole) {
    return NextResponse.next();
  }

  if (payload.role === requiredRole) {
    return NextResponse.next();
  }

  const dashboardPath = getDashboardForRole(payload.role);
  if (dashboardPath) {
    return NextResponse.redirect(new URL(dashboardPath, request.url));
  }

  return NextResponse.redirect(new URL('/', request.url));
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile'],
};
