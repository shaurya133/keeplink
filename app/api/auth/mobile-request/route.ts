import { NextRequest, NextResponse } from "next/server";
import { mobileCorsHeaders } from "@/lib/mobile-auth";
import { createOtp, hasValidOtp } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/mailer";
import { z } from "zod";

const schema = z.object({ email: z.string().email() });

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: mobileCorsHeaders() });
}

export async function POST(req: NextRequest) {
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
