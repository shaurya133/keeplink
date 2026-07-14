import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { createOtp, hasValidOtp } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/mailer";
import { PENDING_EMAIL_COOKIE } from "@/lib/magic-link";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/links");

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 text-ink">
      <div className="w-full max-w-sm space-y-[var(--space-6)]">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl">KeepLink</h1>
          <p className="text-sm opacity-65">Save links to read later.</p>
        </div>
        <form
          action={async (formData) => {
            "use server";
            const email = String(formData.get("email") ?? "").trim().toLowerCase();
            if (!email.includes("@")) return;

            if (!await hasValidOtp(email)) {
              const code = await createOtp(email);
              await sendOtpEmail(email, code);
            }

            (await cookies()).set(PENDING_EMAIL_COOKIE, email, {
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              maxAge: 60 * 15,
              path: "/",
            });

            redirect("/verify-request");
          }}
          className="space-y-[var(--space-3)]"
        >
          <input
            type="email"
            name="email"
            required
            placeholder="you@example.com"
            className="input"
          />
          <button type="submit" className="btn btn-primary w-full">
            Send code
          </button>
        </form>
      </div>
    </div>
  );
}
