import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import {
  ADMIN_COOKIE_NAME,
  parseCookie,
  verifyAdminSessionToken,
} from "./adminAuth.server";

export const getAdminSession = createServerFn({ method: "GET" }).handler(async () => {
  const request = getRequest();
  const cookieHeader = request?.headers.get("cookie") ?? null;
  const token = parseCookie(cookieHeader, ADMIN_COOKIE_NAME);
  const result = await verifyAdminSessionToken(token);
  if (!result.valid) {
    return { authenticated: false as const, adminId: undefined };
  }
  return { authenticated: true as const, adminId: result.adminId };
});
