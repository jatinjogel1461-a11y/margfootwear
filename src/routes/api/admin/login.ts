import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start/server-only";
import {
  buildSessionCookie,
  createAdminSessionToken,
  isAdminAuthConfigured,
  verifyAdminCredentials,
} from "@/lib/adminAuth.server";

export const Route = createFileRoute("/api/admin/login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          if (!isAdminAuthConfigured()) {
            return Response.json(
              { error: "Admin authentication is not configured" },
              { status: 503 },
            );
          }

          let body: unknown;
          try {
            body = await request.json();
          } catch {
            return Response.json({ error: "Invalid request body" }, { status: 400 });
          }

          const { adminId, password } = (body ?? {}) as {
            adminId?: unknown;
            password?: unknown;
          };

          if (
            typeof adminId !== "string" ||
            typeof password !== "string" ||
            !adminId.trim() ||
            !password ||
            adminId.length > 128 ||
            password.length > 256
          ) {
            return Response.json(
              { error: "Admin ID and password are required" },
              { status: 400 },
            );
          }

          const valid = await verifyAdminCredentials(adminId.trim(), password);
          if (!valid) {
            // Generic error — never reveal whether Admin ID or password was incorrect
            return Response.json({ error: "Invalid credentials" }, { status: 401 });
          }

          const token = await createAdminSessionToken(adminId.trim());
          return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Set-Cookie": buildSessionCookie(token, request),
              "Cache-Control": "no-store",
            },
          });
        } catch {
          return Response.json({ error: "Authentication failed" }, { status: 500 });
        }
      },
    },
  },
});
