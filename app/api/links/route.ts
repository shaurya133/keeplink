import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { fetchMetadata } from "@/lib/metadata";
import { getUserFromBearer, mobileCorsHeaders } from "@/lib/mobile-auth";
import { urlSchema } from "@/lib/validation";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: mobileCorsHeaders() });
}

export async function GET(req: NextRequest) {
  const user = await getUserFromBearer(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: mobileCorsHeaders() });

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status") ?? "unread";
  const tag = searchParams.get("tag") ?? null;
  const q = searchParams.get("q")?.trim() ?? null;

  const statusFilter: Prisma.LinkWhereInput =
    status === "unread" ? { status: "UNREAD" }
    : status === "read" ? { status: "READ" }
    : status === "archived" ? { status: "ARCHIVED" }
    : {};

  const where: Prisma.LinkWhereInput = {
    userId: user.id,
    ...statusFilter,
    ...(tag ? { tags: { some: { tag: { name: tag } } } } : {}),
    ...(q ? {
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { url: { contains: q, mode: "insensitive" } },
        { tags: { some: { tag: { name: { contains: q, mode: "insensitive" } } } } },
      ],
    } : {}),
  };

  const links = await prisma.link.findMany({
    where,
    include: { tags: { include: { tag: true } } },
    orderBy: { addedAt: "desc" },
  });

  return NextResponse.json(links, { headers: mobileCorsHeaders() });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromBearer(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: mobileCorsHeaders() });

  const body = await req.json().catch(() => null);
  const parsed = urlSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid URL" },
      { status: 400, headers: mobileCorsHeaders() }
    );
  }

  const { url } = parsed.data;

  const existing = await prisma.link.findUnique({
    where: { userId_url: { userId: user.id, url } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "You've already saved this link." },
      { status: 409, headers: mobileCorsHeaders() }
    );
  }

  const metadata = await fetchMetadata(url);

  const link = await prisma.link.create({
    data: {
      userId: user.id,
      url,
      title: metadata.title,
      description: metadata.description,
      thumbnail: metadata.thumbnail,
      favicon: metadata.favicon,
      domain: metadata.domain,
      readingTime: metadata.readingTime,
      content: metadata.content,
    },
    include: { tags: { include: { tag: true } } },
  });

  return NextResponse.json(link, { status: 201, headers: mobileCorsHeaders() });
}
