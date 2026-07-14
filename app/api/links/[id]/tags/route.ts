import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromBearer, mobileCorsHeaders } from "@/lib/mobile-auth";
import { tagNameSchema } from "@/lib/validation";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: mobileCorsHeaders() });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUserFromBearer(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: mobileCorsHeaders() });

  const body = await req.json().catch(() => null);
  const name = tagNameSchema.safeParse(body?.name);
  if (!name.success) {
    return NextResponse.json({ error: "Invalid tag name" }, { status: 400, headers: mobileCorsHeaders() });
  }

  const link = await prisma.link.findFirst({ where: { id: params.id, userId: user.id } });
  if (!link) return NextResponse.json({ error: "Not found" }, { status: 404, headers: mobileCorsHeaders() });

  const tag = await prisma.tag.upsert({
    where: { userId_name: { userId: user.id, name: name.data } },
    create: { userId: user.id, name: name.data },
    update: {},
  });

  await prisma.linkTag.upsert({
    where: { linkId_tagId: { linkId: params.id, tagId: tag.id } },
    create: { linkId: params.id, tagId: tag.id },
    update: {},
  });

  return NextResponse.json({ id: tag.id, name: tag.name }, { status: 201, headers: mobileCorsHeaders() });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUserFromBearer(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: mobileCorsHeaders() });

  const tagId = req.nextUrl.searchParams.get("tagId");
  if (!tagId) return NextResponse.json({ error: "tagId required" }, { status: 400, headers: mobileCorsHeaders() });

  const [link, tag] = await Promise.all([
    prisma.link.findFirst({ where: { id: params.id, userId: user.id } }),
    prisma.tag.findFirst({ where: { id: tagId, userId: user.id } }),
  ]);
  if (!link || !tag) return NextResponse.json({ error: "Not found" }, { status: 404, headers: mobileCorsHeaders() });

  await prisma.linkTag.deleteMany({ where: { linkId: params.id, tagId } });

  const remaining = await prisma.linkTag.count({ where: { tagId } });
  if (remaining === 0) await prisma.tag.delete({ where: { id: tagId } });

  return NextResponse.json({ ok: true }, { headers: mobileCorsHeaders() });
}
