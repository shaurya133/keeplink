import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendMagicLinkEmail(email: string, url: string) {
  const { data, error } = await resend.emails.send({
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
