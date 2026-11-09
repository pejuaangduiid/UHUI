import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasAccessCookie =
    request.cookies.has("__Host-access") ||
    request.cookies.has("uhui_access");
  const hasRefreshCookie =
    request.cookies.has("__Secure-refresh") ||
    request.cookies.has("uhui_refresh");

  if (!hasAccessCookie && !hasRefreshCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const isDev = process.env.NODE_ENV !== "production";
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const cspHeader = isDev
    ? "default-src 'self' http: ws:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; font-src 'self'; connect-src 'self' ws: http:;"
    : `
    default -src 'self';
  script - src 'self' 'nonce-${nonce}' 'strict-dynamic';
  style - src 'self' 'unsafe-inline';
  img - src 'self' blob: data: ;
  font - src 'self';
  object - src 'none';
  base - uri 'self';
  form - action 'self';
  frame - ancestors 'none';
  upgrade - insecure - requests;
  `.replace(/\s{2,}/g, " ").trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", cspHeader);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set("Content-Security-Policy", cspHeader);
  return response;
}

export const config = {
  matcher: [
    "/sme/:path*",
    "/invest/:path*",
    "/admin/:path*",
  ],
};

