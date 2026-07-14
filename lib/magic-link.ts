import { prisma } from "@/lib/prisma";

export const MAGIC_LINK_MAX_AGE_SECONDS = 24 * 60 * 60;

const RESEND_COOLDOWN_SECONDS = 30;

const PENDING_EMAIL_COOKIE = "keeplink-pending-email";

export { PENDING_EMAIL_COOKIE };

// VerificationToken has no createdAt column, so we derive when a token was
// issued from its expiry (expires - maxAge) to rate-limit resend requests.
export async function getMagicLinkCooldownSeconds(email: string) {
  const latest = await prisma.verificationToken.findFirst({
    where: { identifier: email },
    orderBy: { expires: "desc" },
  });
  if (!latest) return 0;

  const sentAtMs = latest.expires.getTime() - MAGIC_LINK_MAX_AGE_SECONDS * 1000;
  const elapsedSeconds = (Date.now() - sentAtMs) / 1000;
  const remaining = RESEND_COOLDOWN_SECONDS - elapsedSeconds;
  return remaining > 0 ? Math.ceil(remaining) : 0;
}
