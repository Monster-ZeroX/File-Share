import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY);
export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'no-reply@fileshare.kaveeshainduwara.lk';

export async function sendOTP(email: string, code: string) {
  return resend.emails.send({
    from: `SLIIT File Share <${FROM_EMAIL}>`,
    to: email,
    subject: 'Your SLIIT File Share Login OTP',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
        <h2 style="color: #333; text-align: center;">Verify your sign-up</h2>
        <p style="color: #555; text-align: center;">We have received a sign-up attempt with the following code. Please enter it in the browser window where you started the process.</p>
        <div style="background-color: #f4f4f5; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <h1 style="letter-spacing: 5px; color: #111; margin: 0;">${code}</h1>
        </div>
        <p style="color: #888; text-align: center; font-size: 14px;">If you did not attempt to sign up, please disregard this email. The code will remain active for 10 minutes.</p>
        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
        <p style="color: #888; text-align: center; font-size: 12px;">© ${new Date().getFullYear()} SLIIT File Share.</p>
      </div>
    `,
  });
}

export async function sendShareNotification(email: string, senderName: string, fileName: string, fileLink: string) {
  return resend.emails.send({
    from: `SLIIT File Share <${FROM_EMAIL}>`,
    to: email,
    subject: `${senderName} shared a file with you!`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
        <h2 style="color: #333; text-align: center;">You received a file!</h2>
        <p style="color: #555; text-align: center;"><strong>${senderName}</strong> has shared a file with you via SLIIT File Share.</p>
        <div style="background-color: #f4f4f5; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <p style="color: #333; font-weight: bold; margin-bottom: 15px;">${fileName}</p>
          <a href="${fileLink}" style="background-color: #0070f3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View / Download File</a>
        </div>
        <p style="color: #888; text-align: center; font-size: 14px;">Log in to your dashboard to view all your received files.</p>
      </div>
    `,
  });
}
