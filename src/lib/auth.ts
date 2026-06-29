// ============================================================
// Utilidades de autenticación para usuarios del panel
// JWT firmado con HS256 usando jose
// ============================================================

import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'santiago-te-premia-super-secret-key-2026'
);

export interface UserTokenPayload {
  userId: string;
  email: string;
  role: string;
  businessId?: string | null;
}

/**
 * Genera un JWT firmado para un usuario del panel (admin o comercio)
 */
export async function createUserToken(payload: UserTokenPayload): Promise<string> {
  const token = await new SignJWT({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    businessId: payload.businessId || null,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
  return token;
}

/**
 * Verifica un JWT de usuario del panel y retorna el payload
 */
export async function verifyUserToken(token: string): Promise<UserTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as UserTokenPayload;
  } catch {
    return null;
  }
}

/**
 * Extrae y verifica el token del header Authorization de un request
 * Formato esperado: "Bearer <token>"
 */
export async function getAuthUser(request: Request): Promise<UserTokenPayload | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.slice(7);
  return verifyUserToken(token);
}
