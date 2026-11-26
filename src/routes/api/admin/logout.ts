import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start/server-only";
import { buildClearSessionCookie } from "@/lib/adminAuth.server";

export const Route = createFileRoute("/api/admin/logout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie": buildClearSessionCookie(request),
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});
