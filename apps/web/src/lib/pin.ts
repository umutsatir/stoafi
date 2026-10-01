/**
 * The PIN lock. It keeps the app out of sight of someone who picks up the device; it does not encrypt
 * the stored data, and the settings say so. The PIN itself is never stored: only a salted hash.
 */
const ITERATIONS = 100_000;

export interface PinLock {
  salt: string;
  hash: string;
}

export const PIN_PATTERN = /^\d{4,8}$/;

export function isValidPin(pin: string): boolean {
  return PIN_PATTERN.test(pin);
}

function toHex(bytes: Uint8Array): string {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

async function derive(pin: string, salt: Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(pin), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations: ITERATIONS },
    key,
    256,
  );
  return toHex(new Uint8Array(bits));
}

export async function createLock(pin: string): Promise<PinLock> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { salt: toHex(salt), hash: await derive(pin, salt) };
}

export async function verifyPin(pin: string, lock: PinLock): Promise<boolean> {
  if (!isValidPin(pin)) return false;
  const attempt = await derive(pin, fromHex(lock.salt));
  // Compare every character so the time taken does not hint at how many were right.
  let difference = attempt.length === lock.hash.length ? 0 : 1;
  for (let i = 0; i < attempt.length; i++) {
    difference |= attempt.charCodeAt(i) ^ (lock.hash.charCodeAt(i) || 0);
  }
  return difference === 0;
}
