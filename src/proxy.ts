import { NextResponse } from 'next/server';

import { auth } from '@/auth';

const LOGIN_PATH = '/login';
const HOME_PATH = '/';

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (pathname === LOGIN_PATH) {
    if (req.auth) {
      return NextResponse.redirect(new URL(HOME_PATH, req.url));
    }
    return;
  }

  if (!req.auth) {
    return NextResponse.redirect(new URL(LOGIN_PATH, req.url));
  }
});

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
