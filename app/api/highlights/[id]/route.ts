import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromBearer, mobileCorsHeaders } from "@/lib/mobile-auth";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: mobileCorsHeaders() });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUserFromBearer(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: mobileCorsHeaders() });

  await prisma.highlight.deleteMany({
    where: { id: params.id, userId: user.id },
  });

  return NextResponse.json({ ok: true }, { headers: mobileCorsHeaders() });
}
