import { createHmac, randomBytes } from "crypto";

// ==========================================================================
// Santiago te Premia – Dynamic PIN (TOTP-like) utility
// ==========================================================================

const DEFAULT_EXPIRATION_SECONDS = 20;

// --------------------------------------------------------------------------
// generatePinSecret – returns a cryptographically random 32-char hex string
// --------------------------------------------------------------------------
export function generatePinSecret(): string {
  return randomBytes(16).toString("hex"); // 16 bytes = 32 hex chars
}

// --------------------------------------------------------------------------
// Internal: compute a 6-digit PIN for a given time-step counter
// --------------------------------------------------------------------------
function computePin(secret: string, counter: number): string {
  const hmac = createHmac("sha256", secret);
  hmac.update(counter.toString());
  const digest = hmac.digest("hex");

  // Take the last nibble as an offset, read 4 bytes from that offset,
  // then mod 1_000_000 to produce a 6-digit code.
  const offset = parseInt(digest.substring(digest.length - 1), 16);
  const truncated =
    parseInt(digest.substring(offset * 2, offset * 2 + 8), 16) >>> 0;
  const pin = (truncated % 1_000_000).toString().padStart(6, "0");
  return pin;
}

// --------------------------------------------------------------------------
// getCurrentPin – returns the current 6-digit PIN for the given secret
// --------------------------------------------------------------------------
export function getCurrentPin(
  secret: string,
  expirationSeconds: number = DEFAULT_EXPIRATION_SECONDS,
): string {
  const counter = Math.floor(Date.now() / (expirationSeconds * 1000));
  return computePin(secret, counter);
}

// --------------------------------------------------------------------------
// validatePin – validates a PIN against the current AND previous window
// (handles edge-case where the PIN was generated right before a window flip)
// --------------------------------------------------------------------------
export function validatePin(
  secret: string,
  pin: string,
  expirationSeconds: number = DEFAULT_EXPIRATION_SECONDS,
): boolean {
  const counter = Math.floor(Date.now() / (expirationSeconds * 1000));
  const currentPin = computePin(secret, counter);
  const previousPin = computePin(secret, counter - 1);
  return pin === currentPin || pin === previousPin;
}

// --------------------------------------------------------------------------
// getTimeRemaining – seconds left until the next PIN rotation
// --------------------------------------------------------------------------
export function getTimeRemaining(
  expirationSeconds: number = DEFAULT_EXPIRATION_SECONDS,
): number {
  const windowMs = expirationSeconds * 1000;
  const elapsed = Date.now() % windowMs;
  return Math.ceil((windowMs - elapsed) / 1000);
}
