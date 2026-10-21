import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export default async function middleware(req) {
  const pathname = req.nextUrl.pathname;

  const token = await getToken({ 
    req,
    // Secret key matches your .env
    secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
    // Automatic switching between Local (HTTP) and Live (HTTPS)
    secureCookie: process.env.NODE_ENV === "production", 
  });

  // Authentication check logic
  if (!token && pathname.startsWith('/dashboard')) {
    const signinUrl = new URL('/signin', req.url);
    // Optional: adding callbackUrl helps return to the same page after login
    signinUrl.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(signinUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"]
};