"use client";

import Link from "next/link";

export function TagPill({ name, onRemove, href }: { name: string; onRemove?: () => void; href?: string }) {
  return (
    <span className="tag tag-outline gap-1.5">
      {href ? (
        <Link href={href} className="no-underline text-inherit">
          {name}
        </Link>
      ) : (
        name
      )}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          aria-label={`Remove tag ${name}`}
          className="flex cursor-pointer"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      )}
    </span>
  );
}
