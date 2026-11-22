import crypto from "crypto";
import { cookies } from "next/headers";
import {
  ALL_ADMIN_PERMISSIONS,
  type AdminPermission,
  type AdminUser,
} from "./types";
import {
  getAdminUserById,
  getAdminUserByUsername,
  toPublicAdminUser,
  touchAdminActivity,
  verifyPasswordHash,
} from "./store";

const COOKIE_NAME = "islamic_audio_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function getAuthSecret(): string {
  return process.env.AUTH_SECRET || "local-dev-secret-change-in-production-32chars";
}

export function getAdminCredentials() {
  const username = (process.env.ADMIN_USERNAME || "admin").trim();
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const isDefault = !process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD === "changeme123";
  return { username, password, isDefault };
}

function getOwnerProfile(): AdminUser {
  const { username } = getAdminCredentials();
  return {
    id: "owner",
    username,
    displayName: "المدير العام (المالك)",
    role: "owner",
    permissions: [...ALL_ADMIN_PERMISSIONS],
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    lastActiveAt: new Date().toISOString(),
  };
}

function signPayload(payloadB64: string): string {
  return crypto
    .createHmac("sha256", getAuthSecret())
    .update(payloadB64)
    .digest("base64url");
}

export function createSessionToken(user: { id: string; username: string }): string {
  const payload = JSON.stringify({
    uid: user.id,
    u: user.username,
    exp: Date.now() + SESSION_TTL_MS,
  });
  const payloadB64 = Buffer.from(payload, "utf8").toString("base64url");
  const sig = signPayload(payloadB64);
  return `${payloadB64}.${sig}`;
}

export function verifySessionToken(
  token: string | undefined
): { id: string; username: string } | null {
  if (!token || !token.includes(".")) return null;
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return null;

  const expectedSig = signPayload(payloadB64);
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

  try {
    const data = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8")) as {
      uid?: string;
      u?: string;
      exp?: number;
    };
    if (!data.u || !data.exp || Date.now() > data.exp) return null;
    return {
      id: data.uid || (data.u === getAdminCredentials().username ? "owner" : data.u),
      username: data.u,
    };
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<AdminUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const parsed = verifySessionToken(token);
  if (!parsed) return null;

  const ownerCreds = getAdminCredentials();
  if (
    parsed.id === "owner" ||
    parsed.username.toLowerCase() === ownerCreds.username.toLowerCase()
  ) {
    return getOwnerProfile();
  }

  const record =
    (await getAdminUserById(parsed.id)) || (await getAdminUserByUsername(parsed.username));
  if (!record || !record.isActive) return null;

  // Non-blocking activity timestamp update so concurrent admins show live activity
  void touchAdminActivity(record.id).catch(() => undefined);
  return toPublicAdminUser(record);
}

export function hasAdminPermission(
  session: AdminUser | null,
  permission: AdminPermission
): boolean {
  if (!session || !session.isActive) return false;
  if (session.role === "owner") return true;
  return session.permissions.includes(permission);
}

export async function setAdminSessionCookie(user: {
  id: string;
  username: string;
}): Promise<void> {
  const token = createSessionToken(user);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}

export async function clearAdminSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function authenticateAdminUser(
  username: string,
  password: string
): Promise<AdminUser | null> {
  const cleanUser = username.trim();
  if (!cleanUser || !password) return null;

  // 1. Check root owner credentials from environment / defaults
  const expected = getAdminCredentials();
  const uOwnerMatch =
    cleanUser.toLowerCase().length === expected.username.toLowerCase().length &&
    crypto.timingSafeEqual(
      Buffer.from(cleanUser.toLowerCase()),
      Buffer.from(expected.username.toLowerCase())
    );
  const pOwnerMatch =
    password.length === expected.password.length &&
    crypto.timingSafeEqual(Buffer.from(password), Buffer.from(expected.password));

  if (uOwnerMatch && pOwnerMatch) {
    return getOwnerProfile();
  }

  // 2. Check database admin users
  const record = await getAdminUserByUsername(cleanUser);
  if (!record || !record.isActive) return null;
  if (!verifyPasswordHash(password, record.passwordHash)) return null;

  await touchAdminActivity(record.id);
  return toPublicAdminUser(record);
}
