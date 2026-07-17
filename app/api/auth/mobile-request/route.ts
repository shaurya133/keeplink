import { NextRequest, NextResponse } from "next/server";
import { mobileCorsHeaders } from "@/lib/mobile-auth";
import { createOtp, hasValidOtp } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/mailer";
import { z } from "zod";

const schema = z.object({ email: z.string().email() });

const OTP_REQUEST_LIMIT = 5;
const OTP_REQUEST_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const otpRequestMap = new Map<string, { count: number; resetAt: number }>();

function isIpRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = otpRequestMap.get(ip);
  if (!entry || now > entry.resetAt) {
    otpRequestMap.set(ip, { count: 1, resetAt: now + OTP_REQUEST_WINDOW_MS });
    return false;
  }
  if (entry.count >= OTP_REQUEST_LIMIT) return true;
  entry.count++;
  return false;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: mobileCorsHeaders() });
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  if (isIpRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: mobileCorsHeaders() }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400, headers: mobileCorsHeaders() });
  }

  const { email } = parsed.data;

  if (!await hasValidOtp(email)) {
    const code = await createOtp(email);
    await sendOtpEmail(email, code);
  }

  return NextResponse.json({ ok: true }, { headers: mobileCorsHeaders() });
}
