import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";

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
            await signIn("nodemailer", { ...Object.fromEntries(formData), redirectTo: "/links" });
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
            Send magic link
          </button>
        </form>
      </div>
    </div>
  );
}
