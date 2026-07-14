import { cookies } from "next/headers";
import { signIn } from "@/auth";
import { getMagicLinkCooldownSeconds, PENDING_EMAIL_COOKIE } from "@/lib/magic-link";

export default async function VerifyRequestPage() {
  const email = (await cookies()).get(PENDING_EMAIL_COOKIE)?.value;
  const cooldown = email ? await getMagicLinkCooldownSeconds(email) : 0;

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 text-ink">
      <div className="w-full max-w-sm space-y-[var(--space-4)] text-center">
        <h1 className="text-2xl">Check your email</h1>
        <p className="text-sm opacity-65">
          {email
            ? `A sign-in link was sent to ${email}. Click it to continue.`
            : "A sign-in link has been sent. Click it to continue."}
        </p>
        {email && (
          <form
            action={async () => {
              "use server";
              const remaining = await getMagicLinkCooldownSeconds(email);
              if (remaining > 0) return;
              await signIn("nodemailer", { email, redirectTo: "/links" });
            }}
          >
            <button
              type="submit"
              disabled={cooldown > 0}
              className="btn btn-ghost w-full justify-center"
            >
              {cooldown > 0 ? `Resend available in ${cooldown}s` : "Resend link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
