import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith('/(authenticated)')) return NextResponse.next();

  const hasAccess = Boolean(req.cookies.get('access_token'));
  const hasRefresh = Boolean(req.cookies.get('refresh_token'));

  if (hasAccess || hasRefresh) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = '/login';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/(authenticated)(.*)'],
};
