import { type NextRequest, NextResponse } from 'next/server';

// Protected routes that require auth
const PROTECTED: string[] = [];

export const config = {
  matcher: [],
};

export function proxy(request: NextRequest) {
  const token = request.cookies.get('cinematch_token')?.value;
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));

  if (isProtected && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }
}
