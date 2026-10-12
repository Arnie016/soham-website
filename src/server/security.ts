import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  createHash,
  createHmac,
} from "node:crypto";
import { query } from "./database";
const scrypt = (
  password: string,
  salt: string,
  length: number,
  options: { N: number; r: number; p: number; maxmem: number },
): Promise<Buffer> =>
  new Promise((resolve, reject) =>
    scryptCallback(password, salt, length, options, (error, key) =>
      error ? reject(error) : resolve(key),
    ),
  );
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public retryAfter?: number,
    public code?: string,
  ) {
    super(message);
  }
}
export const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export const newToken = () => randomBytes(32).toString("base64url");
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, 64, {
    N: 32768,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  })) as Buffer;
  return `scrypt:${salt}:${derived.toString("hex")}`;
}
export async function checkPassword(password: string, hash: string | null) {
  const [, salt, stored] = (hash || "scrypt:invalid:00").split(":");
  const derived = (await scrypt(password, salt, 64, {
    N: 32768,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  })) as Buffer;
  const expected = Buffer.from(stored, "hex");
  return (
    expected.length === derived.length && timingSafeEqual(expected, derived)
  );
}
export function checkOrigin(request: Request) {
  const expected = process.env.APP_URL || new URL(request.url).origin;
  if (request.headers.get("origin") !== new URL(expected).origin)
    throw new HttpError(403, "Please reload this page and try again.");
  if (
    process.env.VERCEL &&
    (!process.env.APP_URL?.startsWith("https://") ||
      !process.env.RATE_LIMIT_SECRET)
  )
    throw new HttpError(
      503,
      "The studio workspace is being configured. Please contact Soham by email.",
    );
}
export async function limit(key: string, max: number, windowMs: number) {
  const privateKey = createHmac(
    "sha256",
    process.env.RATE_LIMIT_SECRET || "local-development-only",
  )
    .update(key)
    .digest("hex");
  const now = Date.now();
  const [row] = await query<{ count: number; reset_at: number }>(
    `INSERT INTO rate_limits(key,count,reset_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN reset_at<? THEN 1 ELSE count+1 END, reset_at=CASE WHEN reset_at<? THEN excluded.reset_at ELSE reset_at END RETURNING count,reset_at`,
    [privateKey, now + windowMs, now, now],
  );
  if (row.count > max)
    throw new HttpError(
      429,
      `Too many attempts. Try again in ${Math.max(1, Math.ceil((row.reset_at - now) / 60000))} minutes, or use the email link.`,
      Math.max(1, Math.ceil((row.reset_at - now) / 1000)),
    );
}
export function ipKey(request: Request) {
  // Vercel overwrites this header; locally all traffic is deliberately one bucket.
  return process.env.VERCEL
    ? request.headers.get("x-vercel-forwarded-for") || "unknown"
    : "local";
}
export async function readBody(request: Request, max = 16384) {
  if (Number(request.headers.get("content-length") || 0) > max)
    throw new HttpError(413, "This submission is too large.");
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "Please complete the form.");
  let length = 0;
  const parts: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > max) {
      await reader.cancel();
      throw new HttpError(413, "This submission is too large.");
    }
    parts.push(value);
  }
  return Buffer.concat(parts);
}
export async function jsonBody(request: Request) {
  try {
    return JSON.parse((await readBody(request)).toString());
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(400, "Please check the form and try again.");
  }
}
