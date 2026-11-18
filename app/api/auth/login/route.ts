import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  createAdminToken,
  validateAdminCredentials,
} from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      username?: string;
      password?: string;
    };

    const username = (body.username ?? "").trim();
    const password = body.password ?? "";

    if (!validateAdminCredentials(username, password)) {
      return NextResponse.json(
        { error: "Username atau password salah." },
        { status: 401 }
      );
    }

    const token = await createAdminToken(username);
    const response = NextResponse.json({ ok: true, username });

    response.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Permintaan tidak valid." },
      { status: 400 }
    );
  }
}
