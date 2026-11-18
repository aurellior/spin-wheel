import { NextResponse } from "next/server";
import {
  clearSpinHistory,
  getPublicState,
  updateOptions,
} from "@/lib/server-store";
import type { WheelOption } from "@/lib/spin-wheel";

export async function GET() {
  return NextResponse.json(getPublicState());
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      action?: string;
      options?: WheelOption[];
    };

    if (body.action === "clearHistory") {
      clearSpinHistory();
      return NextResponse.json(getPublicState());
    }

    if (Array.isArray(body.options)) {
      if (body.options.length < 2) {
        return NextResponse.json(
          { error: "Minimal harus ada 2 opsi." },
          { status: 400 }
        );
      }
      updateOptions(body.options);
      return NextResponse.json(getPublicState());
    }

    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
