import type { NextRequest } from "next/server";
import { isCronAuthenticated } from "@/lib/env";

export const maxDuration = 15;

export async function GET(request: NextRequest) {
  if (!isCronAuthenticated(request.headers.get("authorization"))) {
    return new Response("Unauthorized", { status: 401 });
  }

  // We don't actually generate a PDF here — that would require auth context.
  // Instead, we import the chromium module to trigger binary extraction into
  // the container layer cache, warming it for the next real request.
  try {
    await import("@sparticuz/chromium");
    return Response.json({ warmed: true });
  } catch (err) {
    return Response.json(
      { warmed: false, error: err instanceof Error ? err.message : "unknown" },
      { status: 500 },
    );
  }
}
