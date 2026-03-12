import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const secretKey = process.env.JWT_SECRET || 'super-secret-jwt-key-for-sliit-file-share';
const encodedKey = new TextEncoder().encode(secretKey);

const SESSION_COOKIE_NAME = 'sliit_share_session';

export type SessionPayload = {
  userId: string;
  email: string;
  name: string;
  sliit_id: string;
  avatarUrl?: string | null;
  expiresAt: Date;
};

export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey);
}

export async function decrypt(session: string | undefined = '') {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    });
    return payload as SessionPayload;
  } catch (error) {
    return null;
  }
}

export async function createSession(userId: string, email: string, name: string, sliit_id: string, avatarUrl?: string | null) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await encrypt({ userId, email, name, sliit_id, avatarUrl, expiresAt });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });
}

export async function verifySession(request?: Request) {
  // 1. Check for API Key first if request object is provided
  if (request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer sliit_')) {
      const token = authHeader.split(' ')[1];
      const { PrismaClient } = require('@prisma/client');
      // Use a local prisma instance if global isn't easily available here, or import it
      // Actually we can just import prisma from '@/lib/prisma' but we need to resolve circular deps if any.
      // Let's just import it at top level if it's there. Wait, prisma import is not at top level. Let's add it.
      const prisma = require('@/lib/prisma').default;
      
      const apiKey = await prisma.apiKey.findUnique({
        where: { key: token },
        include: { user: true }
      });

      if (apiKey && apiKey.user) {
        return { 
          isAuth: true, 
          userId: apiKey.user.id, 
          email: apiKey.user.email, 
          name: apiKey.user.name, 
          sliit_id: apiKey.user.sliit_id, 
          avatarUrl: apiKey.user.avatarUrl,
          isApiKey: true
        };
      }
    }
  }

  // 2. Fallback to cookies
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = await decrypt(cookie);

  if (!session?.userId) {
    return null;
  }

  return { isAuth: true, userId: session.userId, email: session.email, name: session.name, sliit_id: session.sliit_id, avatarUrl: session.avatarUrl };
}

export async function updateSession(request: NextRequest, response: NextResponse) {
  const session = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!session) return;

  const parsed = await decrypt(session);
  if (!parsed) return;
  
  // Refresh expiration
  parsed.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: await encrypt(parsed),
    httpOnly: true,
    expires: parsed.expiresAt as Date,
    sameSite: 'lax',
    path: '/'
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
