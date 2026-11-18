import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, verifyAdminToken } from "@/lib/auth";
import { getAdminState, subscribeState } from "@/lib/server-store";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const session = await verifyAdminToken(
    cookieStore.get(ADMIN_COOKIE_NAME)?.value
  );
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const sendAdmin = () => {
        const payload = JSON.stringify(getAdminState());
        controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
      };

      sendAdmin();

      const unsubscribe = subscribeState(() => {
        try {
          sendAdmin();
        } catch {
          unsubscribe();
        }
      });

      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          clearInterval(keepAlive);
          unsubscribe();
        }
      }, 20000);

      request.signal.addEventListener("abort", () => {
        clearInterval(keepAlive);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // Stream sudah tertutup
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
