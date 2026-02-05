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

    // Check if system is initialized
    const isInitialized = await checkInitialization(req);

    if (!isInitialized) {
      // Redirect to setup page
      return NextResponse.redirect(new URL("/setup", req.url));
    }

    return NextResponse.next();
  },
  {
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/((?!$|login|register|forgot-password|setup|api|auth|oidc|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
