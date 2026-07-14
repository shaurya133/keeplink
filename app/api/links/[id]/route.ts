import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromBearer, mobileCorsHeaders } from "@/lib/mobile-auth";
import { z } from "zod";

const patchSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("markRead") }),
  z.object({ action: z.literal("markUnread") }),
  z.object({ action: z.literal("archive") }),
  z.object({ action: z.literal("updateTitle"), title: z.string().min(1) }),
]);

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: mobileCorsHeaders() });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUserFromBearer(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: mobileCorsHeaders() });

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400, headers: mobileCorsHeaders() });
  }

  const { action } = parsed.data;

  const data =
    action === "markRead" ? { status: "READ" as const, readAt: new Date() }
    : action === "markUnread" ? { status: "UNREAD" as const, readAt: null, archivedAt: null }
    : action === "archive" ? { status: "ARCHIVED" as const, archivedAt: new Date() }
    : { title: parsed.data.title };

  await prisma.link.updateMany({
    where: { id: params.id, userId: user.id },
    data,
  });

  return NextResponse.json({ ok: true }, { headers: mobileCorsHeaders() });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUserFromBearer(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: mobileCorsHeaders() });

  await prisma.link.deleteMany({ where: { id: params.id, userId: user.id } });

  return NextResponse.json({ ok: true }, { headers: mobileCorsHeaders() });
}
