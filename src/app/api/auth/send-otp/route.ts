import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendOTP } from '@/lib/resend';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { name, email, sliit_id, mode, password } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Upsert user (allow them to sign up again / re-verify if needed)
    // Be careful with unique constraints if email or sliit_id changes across attempts
    let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    
    if (mode === 'signin' && !user) {
      return NextResponse.json({ error: 'Account not found. Please sign up first.' }, { status: 404 });
    }

    if (mode === 'signup' && sliit_id) {
      const normalizedSliitId = sliit_id.toUpperCase();
      const existingIdUser = await prisma.user.findUnique({ where: { sliit_id: normalizedSliitId }});

      if (existingIdUser && existingIdUser.email !== normalizedEmail) {
         return NextResponse.json({ error: 'SLIIT ID is already registered with another email' }, { status: 400 });
      }

      const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

      if (!user) {
        user = await prisma.user.create({
          data: {
            name,
            email: normalizedEmail,
            sliit_id: normalizedSliitId,
            password: hashedPassword,
          },
        });
      } else if (!user.verified) {
         // Update the password/name if they are re-trying signup
         user = await prisma.user.update({
            where: { email: normalizedEmail },
            data: { name, sliit_id: normalizedSliitId, password: hashedPassword }
         });
      } else {
         // User already verified
         return NextResponse.json({ error: 'This email is already registered. Please sign in.' }, { status: 400 });
      }
    }

    // Generate 6 digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    // Save to DB
    await prisma.oTP.create({
      data: {
        email: normalizedEmail,
        code,
        expiresAt,
      },
    });

    // Send via Resend
    const res = await sendOTP(normalizedEmail, code);
    
    if (res.error) {
       console.error(res.error);
       return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'OTP sent successfully' });

  } catch (error) {
    console.error('Send OTP Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
