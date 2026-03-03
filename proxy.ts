import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Check if system is initialized
async function checkInitialization(req: NextRequest) {
  try {
    const url = new URL("/api/system/init-status", req.url);
    const response = await fetch(url.toString());
    const data = await response.json();
    return data.initialized === true;
  } catch (error) {
    console.error("Failed to check initialization:", error);
    // On error, assume initialized to avoid blocking
    return true;
  }
}

export default withAuth(
  async function middleware(req) {
    const { pathname } = req.nextUrl;

    // Skip initialization check for setup and API routes
    if (pathname.startsWith("/setup") ||
      pathname.startsWith("/api/system/init-status")) {
      return NextResponse.next();
    }

    // Fast path: if we already checked and it's initialized, skip checking again
    if (req.cookies.has("system_initialized")) {
      return NextResponse.next();
    }

    // Check if system is initialized
    const isInitialized = await checkInitialization(req);

    if (!isInitialized) {
      // Redirect to setup page
      return NextResponse.redirect(new URL("/setup", req.url));
    }

    // If initialized, set a cookie to remember it
    const response = NextResponse.next();
    response.cookies.set("system_initialized", "true", {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });

    return response;
  },
  {
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/((?!$|login|register|forgot-password|setup|api|auth|oidc|\\.well-known|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
