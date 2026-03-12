import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createSession } from '@/lib/session';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, code, name, sliit_id, mode, password } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and code are required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find latest OTP
    const otpRecord = await prisma.oTP.findFirst({
      where: { email: normalizedEmail, code },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return NextResponse.json({ error: 'Invalid or missing OTP code' }, { status: 400 });
    }

    if (new Date() > otpRecord.expiresAt) {
      return NextResponse.json({ error: 'OTP code has expired' }, { status: 400 });
    }

    let user;

    if (mode === 'signup') {
      const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
      // Upsert just in case someone got stuck midway
      user = await prisma.user.upsert({
        where: { email: normalizedEmail },
        update: { verified: true, name, sliit_id: sliit_id.toUpperCase() },
        create: {
          email: normalizedEmail,
          name,
          sliit_id: sliit_id.toUpperCase(),
          password: hashedPassword,
          verified: true
        }
      });
    } else {
      // Signin
      user = await prisma.user.update({
        where: { email: normalizedEmail },
        data: { verified: true }
      });
    }

    // Clean up used OTP and older ones for this email
    await prisma.oTP.deleteMany({
      where: { email: normalizedEmail },
    });

    // 4. Clean up used OTPssion
    await createSession(user.id, user.email, user.name, user.sliit_id, user.avatarUrl);

    return NextResponse.json({ success: true, user });

  } catch (error) {
    console.error('Verify OTP Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
