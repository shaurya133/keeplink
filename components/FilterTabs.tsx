import Link from "next/link";

const TABS: { key: string; label: string }[] = [
  { key: "unread", label: "Unread" },
  { key: "read", label: "Read" },
  { key: "archived", label: "Archived" },
  { key: "all", label: "All" },
];

export function FilterTabs({
  activeStatus,
  buildHref,
}: {
  activeStatus: string;
  buildHref: (params: { status?: string }) => string;
}) {
  return (
    <div className="seg mb-[var(--space-6)]">
      {TABS.map((tab) => {
        const active = activeStatus === tab.key;
        return (
          <Link
            key={tab.key}
            href={buildHref({ status: tab.key })}
            className={`seg-opt ${active ? "is-active" : ""}`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
