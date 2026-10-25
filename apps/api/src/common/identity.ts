import { UnauthorizedException } from '@nestjs/common';
import { verifyToken } from '@clerk/backend';

export async function verifiedSubject(auth?: string): Promise<string> {
  if (!auth?.startsWith('Bearer ') || !auth.slice(7).trim()) throw new UnauthorizedException('Bearer token required');
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) throw new UnauthorizedException('Clerk authentication is not configured');
  const authorizedParties = (process.env.CLERK_AUTHORIZED_PARTIES || '').split(',').map(s => s.trim()).filter(Boolean);
  try {
    const claims = await verifyToken(auth.slice(7).trim(), { secretKey, ...(authorizedParties.length ? { authorizedParties } : {}) });
    if (!claims.sub) throw new Error('Missing subject');
    return claims.sub;
  } catch { throw new UnauthorizedException('Invalid or expired access token'); }
}
