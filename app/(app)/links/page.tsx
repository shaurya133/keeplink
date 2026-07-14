import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { LinkOmniBar } from "@/components/LinkOmniBar";
import { LinkList } from "@/components/LinkList";
import { FilterTabs } from "@/components/FilterTabs";
import { TagSidebar } from "@/components/TagSidebar";
import type { Prisma } from "@prisma/client";

const VALID_STATUSES = new Set(["unread", "read", "all"]);

export default async function LinksPage({
  searchParams,
}: {
  searchParams: { status?: string; tag?: string; q?: string };
}) {
  const user = await requireUser();

  const status = VALID_STATUSES.has(searchParams.status ?? "")
    ? (searchParams.status as string)
    : "unread";
  const tag = searchParams.tag || null;
  const q = searchParams.q?.trim() || null;

  function buildHref(overrides: {
    status?: string;
    tag?: string | null;
    q?: string | null;
  }) {
    const params = new URLSearchParams();
    const nextStatus = overrides.status ?? status;
    const nextTag = overrides.tag !== undefined ? overrides.tag : tag;
    const nextQ = overrides.q !== undefined ? overrides.q : q;
    if (nextStatus && nextStatus !== "unread") params.set("status", nextStatus);
    if (nextTag) params.set("tag", nextTag);
    if (nextQ) params.set("q", nextQ);
    const qs = params.toString();
    return qs ? `/links?${qs}` : "/links";
  }

  const statusFilter: Prisma.LinkWhereInput =
    status === "unread"
      ? { status: "UNREAD" }
      : status === "read"
        ? { status: { in: ["READ", "ARCHIVED"] } }
        : {};

  const where: Prisma.LinkWhereInput = {
    userId: user.id,
    ...statusFilter,
    ...(tag ? { tags: { some: { tag: { name: tag } } } } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { url: { contains: q, mode: "insensitive" } },
            { tags: { some: { tag: { name: { contains: q, mode: "insensitive" } } } } },
          ],
        }
      : {}),
  };

  const [links, tags] = await Promise.all([
    prisma.link.findMany({
      where,
      include: { tags: { include: { tag: true } } },
      orderBy: { addedAt: "desc" },
    }),
    prisma.tag.findMany({
      where: { userId: user.id, links: { some: {} } },
      include: { _count: { select: { links: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  const tagItems = tags.map((t) => ({ id: t.id, name: t.name, count: t._count.links }));

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <aside className="-mx-4 overflow-x-auto border-b-2 border-divider px-4 py-3 sm:mx-0 md:w-[220px] md:flex-shrink-0 md:border-b-0 md:border-r-2 md:px-4 md:py-[var(--space-6)]">
        <TagSidebar
          tags={tagItems}
          activeTag={tag}
          buildHref={(o) => buildHref({ tag: o.tag })}
        />
      </aside>

      <main className="min-w-0 flex-1 max-w-[920px] p-4 sm:p-[var(--space-6)]">
        <LinkOmniBar />
        <FilterTabs
          activeStatus={status}
          buildHref={(o) => buildHref({ status: o.status })}
        />
        <LinkList links={links} />
      </main>
    </div>
  );
}
