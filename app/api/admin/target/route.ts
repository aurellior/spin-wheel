import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, verifyAdminToken } from "@/lib/auth";
import { getAdminState, setForcedWinner } from "@/lib/server-store";

export async function GET() {
  const cookieStore = await cookies();
  const session = await verifyAdminToken(
    cookieStore.get(ADMIN_COOKIE_NAME)?.value
  );
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(getAdminState());
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const session = await verifyAdminToken(
    cookieStore.get(ADMIN_COOKIE_NAME)?.value
  );
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { targetId?: string | null };
    const nextState = setForcedWinner(
      typeof body.targetId === "string" && body.targetId ? body.targetId : null
    );
    return NextResponse.json(nextState);
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
