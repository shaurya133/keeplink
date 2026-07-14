"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";
import { urlSchema, tagNameSchema } from "@/lib/validation";
import { fetchMetadata } from "@/lib/metadata";
import { suggestTags } from "@/lib/tags";

export async function createLink(rawUrl: string) {
  const user = await requireUser();
  const parsed = urlSchema.safeParse({ url: rawUrl });
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid URL" };
  }
  const { url } = parsed.data;

  const existing = await prisma.link.findUnique({
    where: { userId_url: { userId: user.id, url } },
  });
  if (existing) {
    return { ok: false as const, error: "You've already saved this link." };
  }

  const metadata = await fetchMetadata(url);
  const tagNames = suggestTags({
    domain: metadata.domain,
    title: metadata.title,
    description: metadata.description,
  });

  try {
    const tagIds = await Promise.all(
      tagNames.map(async (name) => {
        const tag = await prisma.tag.upsert({
          where: { userId_name: { userId: user.id, name } },
          create: { userId: user.id, name },
          update: {},
        });
        return tag.id;
      }),
    );

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
        tags: { create: tagIds.map((tagId) => ({ tagId })) },
      },
    });

    revalidatePath("/links");
    return { ok: true as const, linkId: link.id };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false as const, error: "You've already saved this link." };
    }
    throw error;
  }
}

export async function updateLinkTitle(linkId: string, title: string) {
  const user = await requireUser();
  await prisma.link.updateMany({
    where: { id: linkId, userId: user.id },
    data: { title },
  });
  revalidatePath("/links");
}

export async function markRead(linkId: string) {
  const user = await requireUser();
  await prisma.link.updateMany({
    where: { id: linkId, userId: user.id },
    data: { status: "READ", readAt: new Date() },
  });
  revalidatePath("/links");
}

export async function archiveLink(linkId: string) {
  const user = await requireUser();
  await prisma.link.updateMany({
    where: { id: linkId, userId: user.id },
    data: { status: "ARCHIVED", archivedAt: new Date() },
  });
  revalidatePath("/links");
}

export async function markUnread(linkId: string) {
  const user = await requireUser();
  await prisma.link.updateMany({
    where: { id: linkId, userId: user.id },
    data: { status: "UNREAD", readAt: null, archivedAt: null },
  });
  revalidatePath("/links");
}

export async function deleteLink(linkId: string) {
  const user = await requireUser();
  await prisma.link.deleteMany({ where: { id: linkId, userId: user.id } });
  revalidatePath("/links");
}

export async function addTagToLink(linkId: string, rawName: string) {
  const user = await requireUser();
  const name = tagNameSchema.parse(rawName);

  const link = await prisma.link.findFirst({
    where: { id: linkId, userId: user.id },
  });
  if (!link) return;

  const tag = await prisma.tag.upsert({
    where: { userId_name: { userId: user.id, name } },
    create: { userId: user.id, name },
    update: {},
  });

  await prisma.linkTag.upsert({
    where: { linkId_tagId: { linkId, tagId: tag.id } },
    create: { linkId, tagId: tag.id },
    update: {},
  });

  revalidatePath("/links");
}

export async function removeTagFromLink(linkId: string, tagId: string) {
  const user = await requireUser();
  const [link, tag] = await Promise.all([
    prisma.link.findFirst({ where: { id: linkId, userId: user.id } }),
    prisma.tag.findFirst({ where: { id: tagId, userId: user.id } }),
  ]);
  if (!link || !tag) return;

  await prisma.linkTag.deleteMany({ where: { linkId, tagId } });
  revalidatePath("/links");
}
