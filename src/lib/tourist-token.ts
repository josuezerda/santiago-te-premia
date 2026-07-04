// Token temporal para identificar turistas en links públicos
// Usa un hash simple con timestamp para crear tokens efímeros (24h)
import crypto from 'crypto';

const SECRET = process.env.TOKEN_SECRET || 'santiago-te-premia-2026';

export function generateTouristToken(touristId: string): string {
  const expiry = Date.now() + 24 * 60 * 60 * 1000; // 24 horas
  const payload = `${touristId}:${expiry}`;
  const signature = crypto.createHmac('sha256', SECRET).update(payload).digest('hex').substring(0, 16);
  // Base64url encode
  const token = Buffer.from(`${payload}:${signature}`).toString('base64url');
  return token;
}

export function verifyTouristToken(token: string): { valid: boolean; touristId: string } {
  try {
    const decoded = Buffer.from(token, 'base64url').toString();
    const parts = decoded.split(':');
    if (parts.length < 3) return { valid: false, touristId: '' };

    const touristId = parts[0];
    const expiry = parseInt(parts[1]);
    const signature = parts[2];

    // Verificar expiración
    if (Date.now() > expiry) return { valid: false, touristId: '' };

    // Verificar firma
    const payload = `${touristId}:${expiry}`;
    const expectedSig = crypto.createHmac('sha256', SECRET).update(payload).digest('hex').substring(0, 16);
    if (signature !== expectedSig) return { valid: false, touristId: '' };

    return { valid: true, touristId };
  } catch {
    return { valid: false, touristId: '' };
  }
}
