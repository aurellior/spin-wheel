import { NextResponse } from "next/server";
import { getPublicState, resolveSpinTarget } from "@/lib/server-store";

export async function POST() {
  const { options } = getPublicState();
  if (options.length < 2) {
    return NextResponse.json(
      { error: "Minimal harus ada 2 opsi untuk memutar roda." },
      { status: 400 }
    );
  }

  const result = resolveSpinTarget();
  return NextResponse.json(result);
}
