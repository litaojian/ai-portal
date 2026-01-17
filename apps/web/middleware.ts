
import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;

  // If the user is not logged in and is trying to access a protected route,
  // redirect them to the login page.
  const isAuthRoute = nextUrl.pathname.startsWith('/auth');
  
  if (!isLoggedIn && !isAuthRoute) {
    return NextResponse.redirect(new URL('/auth/login', nextUrl));
  }

  // If the user is logged in and tries to access an auth route (e.g., login page),
  // redirect them to the home page.
  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL('/', nextUrl));
  }

  // Allow the request to proceed
  return NextResponse.next();
});

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
