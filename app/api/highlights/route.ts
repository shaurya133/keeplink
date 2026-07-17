import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromBearer, mobileCorsHeaders } from "@/lib/mobile-auth";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: mobileCorsHeaders() });
}

export async function GET(req: NextRequest) {
  const user = await getUserFromBearer(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: mobileCorsHeaders() });

  const linkId = req.nextUrl.searchParams.get("linkId");

  const highlights = await prisma.highlight.findMany({
    where: { userId: user.id, ...(linkId ? { linkId } : {}) },
    select: {
      id: true,
      text: true,
      linkId: true,
      link: { select: { title: true, domain: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(highlights, { headers: mobileCorsHeaders() });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromBearer(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: mobileCorsHeaders() });

  const body = await req.json().catch(() => null);
  if (!body?.linkId || !body?.text || typeof body.text !== "string" || body.text.length > 2000)
    return NextResponse.json({ error: "linkId and text required (text max 2000 chars)" }, { status: 400, headers: mobileCorsHeaders() });

  const link = await prisma.link.findFirst({
    where: { id: body.linkId, userId: user.id },
  });
  if (!link)
    return NextResponse.json({ error: "Link not found" }, { status: 404, headers: mobileCorsHeaders() });

  const highlight = await prisma.highlight.create({
    data: { userId: user.id, linkId: body.linkId, text: body.text },
    select: { id: true, text: true },
  });

  return NextResponse.json(highlight, { status: 201, headers: mobileCorsHeaders() });
}
