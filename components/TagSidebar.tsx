import Link from "next/link";

export interface TagSidebarItem {
  id: string;
  name: string;
  count: number;
}

function tagClasses(active: boolean) {
  return [
    "flex shrink-0 items-center justify-between gap-2 whitespace-nowrap border-l-2 py-[7px] pl-[10px] text-[13.5px] font-body",
    active ? "border-accent text-accent-700 font-extrabold" : "border-transparent text-ink",
  ].join(" ");
}

export function TagSidebar({
  tags,
  activeTag,
  buildHref,
}: {
  tags: TagSidebarItem[];
  activeTag: string | null;
  buildHref: (params: { tag?: string | null }) => string;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1 md:block md:gap-0">
      <p className="mb-[var(--space-3)] hidden text-[11px] font-extrabold uppercase tracking-[0.1em] text-ink opacity-55 md:block">
        Tags
      </p>
      <Link href={buildHref({ tag: null })} className={tagClasses(!activeTag)}>
        <span>All tags</span>
        <span className="text-[11px] opacity-50">
          {tags.reduce((sum, t) => sum + t.count, 0)}
        </span>
      </Link>
      {tags.map((tag) => (
        <Link
          key={tag.id}
          href={buildHref({ tag: activeTag === tag.name ? null : tag.name })}
          className={tagClasses(activeTag === tag.name)}
        >
          <span>{tag.name}</span>
          <span className="text-[11px] opacity-50">{tag.count}</span>
        </Link>
      ))}
    </div>
  );
}
