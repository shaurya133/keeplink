import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export const OTP_MAX_AGE_SECONDS = 2 * 60 * 60; // 2 hours
export const OTP_COOLDOWN_SECONDS = 30;

function hashOtp(email: string, code: string): string {
  return crypto
    .createHash("sha256")
    .update(`${email}:${code}`)
    .digest("hex");
}

export function generateOtp(): string {
  // Cryptographically random 6-digit code
  const buf = crypto.randomBytes(3);
  const num = ((buf[0] << 16) | (buf[1] << 8) | buf[2]) % 1_000_000;
  return num.toString().padStart(6, "0");
}

export async function hasValidOtp(email: string): Promise<boolean> {
  const record = await prisma.verificationToken.findFirst({
    where: { identifier: email, expires: { gt: new Date() } },
  });
  return !!record;
}

export async function createOtp(email: string): Promise<string> {
  const code = generateOtp();
  const token = hashOtp(email, code);
  const expires = new Date(Date.now() + OTP_MAX_AGE_SECONDS * 1000);

  // Delete any existing tokens for this email before creating a new one
  await prisma.verificationToken.deleteMany({ where: { identifier: email } });

  await prisma.verificationToken.create({
    data: { identifier: email, token, expires },
  });

  return code;
}

const OTP_MAX_ATTEMPTS = 5;

export async function verifyOtp(
  email: string,
  code: string
): Promise<boolean> {
  const record = await prisma.verificationToken.findFirst({
    where: { identifier: email },
  });

  if (!record) return false;

  if (record.expires < new Date()) {
    await prisma.verificationToken
      .delete({ where: { identifier_token: { identifier: email, token: record.token } } })
      .catch(() => {});
    return false;
  }

  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    await prisma.verificationToken
      .delete({ where: { identifier_token: { identifier: email, token: record.token } } })
      .catch(() => {});
    return false;
  }

  const expected = hashOtp(email, code.trim());
  if (record.token !== expected) {
    await prisma.verificationToken
      .update({
        where: { identifier_token: { identifier: email, token: record.token } },
        data: { attempts: { increment: 1 } },
      })
      .catch(() => {});
    return false;
  }

  await prisma.verificationToken
    .delete({ where: { identifier_token: { identifier: email, token: record.token } } })
    .catch(() => {});

  return true;
}

export async function getOtpCooldownSeconds(email: string): Promise<number> {
  const latest = await prisma.verificationToken.findFirst({
    where: { identifier: email },
    orderBy: { expires: "desc" },
  });
  if (!latest) return 0;

  const sentAtMs = latest.expires.getTime() - OTP_MAX_AGE_SECONDS * 1000;
  const elapsed = Math.max(0, (Date.now() - sentAtMs) / 1000);
  const remaining = OTP_COOLDOWN_SECONDS - elapsed;
  return remaining > 0 ? Math.ceil(remaining) : 0;
}
