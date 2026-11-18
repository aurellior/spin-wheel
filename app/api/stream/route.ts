import { getPublicState, subscribeState } from "@/lib/server-store";

export async function GET(request: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const sendPublic = () => {
        const payload = JSON.stringify(getPublicState());
        controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
      };

      // Kirim state awal segera
      sendPublic();

      const unsubscribe = subscribeState(() => {
        try {
          sendPublic();
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
