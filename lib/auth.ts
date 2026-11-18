export const ADMIN_COOKIE_NAME = "admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24; // 24 jam

function getAuthSecret(): string {
  return (
    process.env.AUTH_SECRET ||
    "fallback-dev-secret-change-me-in-env-local"
  );
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64Url(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - (padded.length % 4)) % 4;
  const binary = atob(padded + "=".repeat(padLen));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getHmacKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(getAuthSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export interface AdminSessionPayload {
  username: string;
  exp: number;
}

export async function createAdminToken(username: string): Promise<string> {
  const payload: AdminSessionPayload = {
    username,
    exp: Date.now() + SESSION_TTL_MS,
  };
  const encoder = new TextEncoder();
  const payloadB64 = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const key = await getHmacKey();
  const sigBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payloadB64)
  );
  const sigB64 = toBase64Url(new Uint8Array(sigBuffer));
  return `${payloadB64}.${sigB64}`;
}

export async function verifyAdminToken(
  token: string | undefined | null
): Promise<AdminSessionPayload | null> {
  if (!token || !token.includes(".")) return null;

  const [payloadB64, sigB64] = token.split(".");
  if (!payloadB64 || !sigB64) return null;

  try {
    const encoder = new TextEncoder();
    const key = await getHmacKey();
    const sigBytes = fromBase64Url(sigB64);
    const sigBuffer = new ArrayBuffer(sigBytes.byteLength);
    new Uint8Array(sigBuffer).set(sigBytes);
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBuffer,
      encoder.encode(payloadB64)
    );
    if (!isValid) return null;

    const payloadBytes = fromBase64Url(payloadB64);
    const payload = JSON.parse(
      new TextDecoder().decode(payloadBytes)
    ) as AdminSessionPayload;

    if (!payload.username || typeof payload.exp !== "number") return null;
    if (Date.now() > payload.exp) return null;

    return payload;
  } catch {
    return null;
  }
}

export function validateAdminCredentials(
  username: string,
  password: string
): boolean {
  const expectedUser = process.env.ADMIN_USERNAME || "admin";
  const expectedPass = process.env.ADMIN_PASSWORD || "admin123";
  return username === expectedUser && password === expectedPass;
}
