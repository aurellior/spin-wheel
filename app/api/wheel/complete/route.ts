import { NextResponse } from "next/server";
import { completeSpin, getPublicState } from "@/lib/server-store";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      text?: string;
      color?: string;
    };

    const text =
      typeof body.text === "string" && body.text.trim()
        ? body.text.trim().slice(0, 60)
        : "Opsi Terpilih";
    const color =
      typeof body.color === "string" && body.color.trim()
        ? body.color.trim()
        : "#6366F1";

    completeSpin({ text, color });
    return NextResponse.json(getPublicState());
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
