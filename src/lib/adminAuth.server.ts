// ---------------------------------------------------------------------------
// Server-only single-admin authentication using Web Crypto (PBKDF2 + HMAC-SHA256).
// Compatible with Vercel serverless & edge runtimes. Never import in client code.
// ---------------------------------------------------------------------------
import "@tanstack/react-start/server-only";

export const ADMIN_COOKIE_NAME = "marg_admin_session";
const SESSION_TTL_SECONDS = 8 * 60 * 60; // 8 hours
const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str: string): Uint8Array | null {
  try {
    const padded = str.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (str.length % 4)) % 4);
    const bin = atob(padded);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      out[i] = bin.charCodeAt(i);
    }
    return out;
  } catch {
    return null;
  }
}

function hexToBytes(hex: string): Uint8Array | null {
  if (!/^[0-9a-fA-F]+$/.test(hex) || hex.length % 2 !== 0) return null;
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function timingSafeEqualBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

function timingSafeEqualStr(a: string, b: string): boolean {
  return timingSafeEqualBytes(encoder.encode(a), encoder.encode(b));
}

export function isAdminAuthConfigured(): boolean {
  return Boolean(
    process.env.ADMIN_ID &&
      process.env.ADMIN_PASSWORD_HASH &&
      process.env.ADMIN_SESSION_SECRET,
  );
}

/**
 * Verifies a password against a stored PBKDF2-SHA256 hash:
 * format: pbkdf2$sha256$<iterations>$<saltHex>$<hashHex>
 * (also accepts ':' as separator to avoid Vite/dotenv '$' variable expansion)
 */
export async function verifyAdminPassword(password: string, storedHash: string): Promise<boolean> {
  const clean = storedHash.trim().replace(/^['"]|['"]$/g, "");
  const sep = clean.includes("$") ? "$" : ":";
  const parts = clean.split(sep);
  if (parts.length !== 5 || parts[0] !== "pbkdf2" || parts[1] !== "sha256") {
    return false;
  }
  const iterations = Number(parts[2]);
  if (!Number.isInteger(iterations) || iterations < 10_000 || iterations > 2_000_000) {
    return false;
  }
  const salt = hexToBytes(parts[3]);
  const expected = hexToBytes(parts[4]);
  if (!salt || !expected || salt.length < 8 || expected.length === 0) {
    return false;
  }

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: salt as BufferSource,
      iterations,
    },
    keyMaterial,
    expected.length * 8,
  );
  return timingSafeEqualBytes(new Uint8Array(derivedBits), expected);
}

/**
 * Always runs PBKDF2 before returning so response timing does not reveal
 * whether the Admin ID or the password was incorrect.
 */
export async function verifyAdminCredentials(adminId: string, password: string): Promise<boolean> {
  const expectedId = process.env.ADMIN_ID ?? "";
  const storedHash = process.env.ADMIN_PASSWORD_HASH ?? "";
  if (!expectedId || !storedHash) return false;

  const idMatches = timingSafeEqualStr(adminId, expectedId);
  const pwMatches = await verifyAdminPassword(password, storedHash);
  return idMatches && pwMatches;
}

async function signPayload(payloadB64: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payloadB64));
  return toBase64Url(new Uint8Array(sig));
}

export async function createAdminSessionToken(adminId: string): Promise<string> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET missing");

  const nowSec = Math.floor(Date.now() / 1000);
  const payload = JSON.stringify({
    sub: adminId,
    iat: nowSec,
    exp: nowSec + SESSION_TTL_SECONDS,
  });
  const payloadB64 = toBase64Url(encoder.encode(payload));
  const sigB64 = await signPayload(payloadB64, secret);
  return `${payloadB64}.${sigB64}`;
}

export async function verifyAdminSessionToken(
  token: string | undefined,
): Promise<{ valid: boolean; adminId?: string }> {
  if (!token) return { valid: false };
  const secret = process.env.ADMIN_SESSION_SECRET;
  const expectedId = process.env.ADMIN_ID;
  if (!secret || !expectedId) return { valid: false };

  const dotIdx = token.indexOf(".");
  if (dotIdx <= 0 || dotIdx === token.length - 1) return { valid: false };

  const payloadB64 = token.slice(0, dotIdx);
  const sigB64 = token.slice(dotIdx + 1);
  const expectedSigB64 = await signPayload(payloadB64, secret);

  if (!timingSafeEqualStr(sigB64, expectedSigB64)) {
    return { valid: false };
  }

  const payloadBytes = fromBase64Url(payloadB64);
  if (!payloadBytes) return { valid: false };

  try {
    const parsed = JSON.parse(new TextDecoder().decode(payloadBytes)) as {
      sub?: unknown;
      exp?: unknown;
    };
    const nowSec = Math.floor(Date.now() / 1000);
    if (
      typeof parsed.sub !== "string" ||
      !timingSafeEqualStr(parsed.sub, expectedId) ||
      typeof parsed.exp !== "number" ||
      parsed.exp <= nowSec
    ) {
      return { valid: false };
    }
    return { valid: true, adminId: parsed.sub };
  } catch {
    return { valid: false };
  }
}

export function parseCookie(cookieHeader: string | null, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const k = part.slice(0, eq).trim();
    if (k === name) {
      return decodeURIComponent(part.slice(eq + 1).trim());
    }
  }
  return undefined;
}

function isSecureRequest(request: Request): boolean {
  const proto = request.headers.get("x-forwarded-proto");
  if (proto) return proto.split(",")[0].trim() === "https";
  return request.url.startsWith("https://") || process.env.NODE_ENV === "production";
}

export function buildSessionCookie(token: string, request: Request): string {
  const secure = isSecureRequest(request) ? "; Secure" : "";
  return `${ADMIN_COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}${secure}`;
}

export function buildClearSessionCookie(request: Request): string {
  const secure = isSecureRequest(request) ? "; Secure" : "";
  return `${ADMIN_COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${secure}`;
}
