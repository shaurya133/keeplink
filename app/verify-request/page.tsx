import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { createOtp, getOtpCooldownSeconds } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/mailer";
import { PENDING_EMAIL_COOKIE } from "@/lib/magic-link";

export default async function VerifyRequestPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const email = (await cookies()).get(PENDING_EMAIL_COOKIE)?.value;
  if (!email) redirect("/login");

  const cooldown = await getOtpCooldownSeconds(email);
  const error = searchParams.error;

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 text-ink">
      <div className="w-full max-w-sm space-y-[var(--space-6)]">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl">Enter your code</h1>
          <p className="text-sm opacity-65">
            We sent a 6-digit code to <strong>{email}</strong>
          </p>
        </div>

        <form
          action={async (formData) => {
            "use server";
            const code = String(formData.get("code") ?? "").trim();
            try {
              await signIn("credentials", {
                email,
                code,
                redirectTo: "/links",
              });
            } catch (e) {
              if (e instanceof AuthError) redirect("/verify-request?error=invalid");
              throw e; // re-throw redirect errors so Next.js can handle them
            }
          }}
          className="space-y-[var(--space-3)]"
        >
          <input
            type="text"
            name="code"
            required
            placeholder="123456"
            maxLength={6}
            inputMode="numeric"
            autoComplete="one-time-code"
            className="input text-center text-2xl tracking-[0.5em]"
            autoFocus
          />
          {error === "invalid" && (
            <p className="text-sm text-red-600">Incorrect or expired code. Try again.</p>
          )}
          <button type="submit" className="btn btn-primary w-full">
            Sign in
          </button>
        </form>

        <form
          action={async () => {
            "use server";
            const remaining = await getOtpCooldownSeconds(email);
            if (remaining > 0) return;
            const code = await createOtp(email);
            await sendOtpEmail(email, code);
            redirect("/verify-request");
          }}
        >
          <button
            type="submit"
            disabled={cooldown > 0}
            className="btn btn-ghost w-full justify-center"
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
          </button>
        </form>
      </div>
    </div>
  );
}
