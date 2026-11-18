import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE_NAME, verifyAdminToken } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const session = await verifyAdminToken(token);

  if (pathname.startsWith("/api/admin")) {
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (pathname === "/admin/login") {
    if (session) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    if (!session) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
