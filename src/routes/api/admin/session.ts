import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start/server-only";
import {
  ADMIN_COOKIE_NAME,
  parseCookie,
  verifyAdminSessionToken,
} from "@/lib/adminAuth.server";

export const Route = createFileRoute("/api/admin/session")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = parseCookie(request.headers.get("cookie"), ADMIN_COOKIE_NAME);
        const result = await verifyAdminSessionToken(token);
        if (!result.valid) {
          return Response.json(
            { authenticated: false },
            { status: 401, headers: { "Cache-Control": "no-store" } },
          );
        }
        return Response.json(
          { authenticated: true, adminId: result.adminId },
          { status: 200, headers: { "Cache-Control": "no-store" } },
        );
      },
    },
  },
});
