import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signMobileToken, mobileCorsHeaders } from "@/lib/mobile-auth";
import { verifyOtp } from "@/lib/otp";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: mobileCorsHeaders() });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400, headers: mobileCorsHeaders() });
  }

  const { email, code } = parsed.data;
  const valid = await verifyOtp(email, code);

  if (!valid) {
    return NextResponse.json(
      { error: "Incorrect or expired code." },
      { status: 401, headers: mobileCorsHeaders() }
    );
  }

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: { email, emailVerified: new Date() },
    });
  } else if (!user.emailVerified) {
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });
  }

  const jwt = await signMobileToken(user.id);
  return NextResponse.json({ token: jwt }, { headers: mobileCorsHeaders() });
}
