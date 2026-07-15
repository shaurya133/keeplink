import { Resend } from "resend";

let resend: Resend | null = null;

function getResendClient() {
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

export async function sendMagicLinkEmail(email: string, url: string) {
  const { data, error } = await getResendClient().emails.send({
    from: process.env.EMAIL_FROM ?? "onboarding@resend.dev",
    to: email,
    subject: "Sign in to KeepLink",
    html: `<p>Click below to sign in to KeepLink:</p><p><a href="${url}">${url}</a></p><p>If you didn't request this, you can ignore this email.</p>`,
    text: `Sign in to KeepLink: ${url}`,
  });

  if (error) {
    console.error(`Resend failed to send magic link to ${email}:`, error);
    throw new Error(`Failed to send verification email: ${error.message}`);
  }

  console.log(`Magic link email sent to ${email} (Resend id: ${data?.id})`);
}

export async function sendOtpEmail(email: string, code: string) {
  const { data, error } = await getResendClient().emails.send({
    from: process.env.EMAIL_FROM ?? "onboarding@resend.dev",
    to: email,
    subject: `${code} — your KeepLink code`,
    html: `
      <p>Your KeepLink sign-in code is:</p>
      <p style="font-size:40px;font-weight:800;letter-spacing:8px;color:#9c5640;margin:24px 0;">${code}</p>
      <p style="color:#6b6760;font-size:14px;">This code expires in 2 hours. If you didn't request this, you can ignore this email.</p>
    `,
    text: `Your KeepLink sign-in code is: ${code}\n\nExpires in 2 hours.`,
  });

  if (error) {
    console.error(`Resend failed to send OTP to ${email}:`, error);
    throw new Error(`Failed to send code: ${error.message}`);
  }

  console.log(`OTP email sent to ${email} (Resend id: ${data?.id})`);
}
