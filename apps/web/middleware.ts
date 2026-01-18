import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  console.log('\n--- Middleware Check ---');
  console.log(`Request Path: ${req.nextUrl.pathname}`);
  const secret = process.env.NEXTAUTH_SECRET;
  console.log('NEXTAUTH_SECRET is set:', !!secret);

  const token = await getToken({ req, secret });
  console.log('Token from getToken:', token);

  const { nextUrl } = req;

  const isLoggedIn = !!token;
  const isAuthRoute = nextUrl.pathname.startsWith('/auth');

  // If the user is not logged in and is trying to access a protected route,
  // redirect them to the login page.
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
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};