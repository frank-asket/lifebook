import { adminAuth } from '../lib/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';

export interface AuthRequest {
  headers: {
    authorization?: string;
    [key: string]: string | string[] | undefined;
  };
  user?: DecodedIdToken;
}

export const verifyBearerToken = async (authHeader?: string | null): Promise<DecodedIdToken | null> => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return null;
  }
};
