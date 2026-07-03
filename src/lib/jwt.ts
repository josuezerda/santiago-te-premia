import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'santiago-te-premia-super-secret-key-2026'
);

export async function createTouristToken(touristId: string, name: string): Promise<string> {
  const token = await new SignJWT({ touristId, name })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('48h') // Token expires in 48 hours
    .sign(JWT_SECRET);
  return token;
}

export async function verifyTouristToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { touristId: string; name: string };
  } catch (error) {
    return null;
  }
}
