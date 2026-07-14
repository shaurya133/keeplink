import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromBearer, mobileCorsHeaders } from "@/lib/mobile-auth";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: mobileCorsHeaders() });
}

export async function GET(req: NextRequest) {
  const user = await getUserFromBearer(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: mobileCorsHeaders() });

  const tags = await prisma.tag.findMany({
    where: { userId: user.id, links: { some: {} } },
    include: { _count: { select: { links: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(
    tags.map((t) => ({ id: t.id, name: t.name, count: t._count.links })),
    { headers: mobileCorsHeaders() }
  );
}
