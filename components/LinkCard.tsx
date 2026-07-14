"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { LinkWithTags } from "@/types";
import {
  markRead,
  markUnread,
  archiveLink,
  deleteLink,
  addTagToLink,
  removeTagFromLink,
} from "@/app/(app)/links/actions";
import { TagPill } from "@/components/TagPill";
import { timeAgo } from "@/lib/utils";

export function LinkCard({ link }: { link: LinkWithTags }) {
  const [isPending, startTransition] = useTransition();
  const [isAddingTag, setIsAddingTag] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function run(action: () => Promise<void>) {
    startTransition(async () => {
      await action();
      router.refresh();
    });
  }

  function handleAddTag(e: React.FormEvent) {
    e.preventDefault();
    const name = tagInputRef.current?.value.trim();
    if (!name) return;
    run(() => addTagToLink(link.id, name));
    setIsAddingTag(false);
  }

  const isUnread = link.status === "UNREAD";
  const isArchived = link.status === "ARCHIVED";
  const readLabel = isUnread ? "Mark read" : "Mark unread";
  const readAction = isUnread ? () => markRead(link.id) : () => markUnread(link.id);
  const archiveLabel = isArchived ? "Unarchive" : "Archive";
  const archiveAction = isArchived ? () => markUnread(link.id) : () => archiveLink(link.id);
  const faviconLetter = link.domain?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="flex flex-col gap-[var(--space-3)] border-b-2 border-divider py-[var(--space-4)] sm:flex-row sm:gap-[var(--space-4)]">
      <div className="flex min-w-0 flex-1 gap-[var(--space-4)]">
        <div className="relative h-20 w-28 flex-shrink-0 overflow-hidden border border-divider bg-surface">
          {link.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={link.thumbnail} alt="" className="grayscale h-full w-full object-cover" />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center"
              style={{
                background:
                  "repeating-linear-gradient(135deg, var(--color-neutral-200), var(--color-neutral-200) 8px, var(--color-neutral-100) 8px, var(--color-neutral-100) 16px)",
              }}
            >
              <span className="text-center font-mono text-[9px] leading-[1.4] tracking-[0.03em] text-ink opacity-40">
                preview
                <br />
                image
              </span>
            </div>
          )}
          <div className="absolute bottom-0 left-0 flex h-[22px] w-[22px] items-center justify-center bg-neutral-900 font-heading text-[11px] font-extrabold text-canvas">
            {faviconLetter}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-heading text-[16px] font-extrabold leading-[1.25] text-ink no-underline"
            >
              {link.title || link.url}
            </a>
            {isUnread && <span className="h-[7px] w-[7px] flex-shrink-0 bg-accent" />}
          </div>

          {link.description && (
            <p
              className="mt-[5px] overflow-hidden text-[13px] leading-[1.5] opacity-75"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {link.description}
            </p>
          )}

          <div className="mt-[var(--space-3)] flex flex-wrap items-center gap-[var(--space-2)]">
            <span className="card-meta">{link.domain}</span>
            {link.readingTime && (
              <>
                <span className="text-[11px] opacity-40">·</span>
                <span className="card-meta">{link.readingTime} min read</span>
              </>
            )}
            <span className="text-[11px] opacity-40">·</span>
            <span className="card-meta">{timeAgo(new Date(link.addedAt))}</span>

            {link.tags.map(({ tag }) => (
              <TagPill
                key={tag.id}
                name={tag.name}
                href={`/links?status=all&tag=${encodeURIComponent(tag.name)}`}
                onRemove={() => run(() => removeTagFromLink(link.id, tag.id))}
              />
            ))}

            {isAddingTag ? (
              <form onSubmit={handleAddTag} className="inline-flex items-center gap-1">
                <input
                  ref={tagInputRef}
                  autoFocus
                  placeholder="tag name"
                  className="w-20 border border-divider bg-surface px-2 py-0.5 text-xs focus:outline-none"
                />
                <button type="submit" className="btn btn-primary px-2 py-0.5 text-xs">
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingTag(false)}
                  className="text-xs text-ink opacity-60 hover:opacity-100"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingTag(true)}
                className="btn btn-ghost text-[11px]"
              >
                + tag
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-shrink-0 flex-row flex-wrap gap-x-[var(--space-3)] gap-y-0.5 sm:flex-col sm:items-start sm:justify-center sm:gap-0.5">
        <button
          disabled={isPending}
          onClick={() => run(readAction)}
          className="btn btn-ghost gap-1.5 text-[13px]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
          {readLabel}
        </button>
        <button
          disabled={isPending}
          onClick={() => run(archiveAction)}
          className="btn btn-ghost gap-1.5 text-[13px]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="4" />
            <path d="M5 8v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8" />
            <path d="M10 12h4" />
          </svg>
          {archiveLabel}
        </button>
        <button
          disabled={isPending}
          onClick={() => run(() => deleteLink(link.id))}
          className="btn btn-ghost gap-1.5 text-[13px] text-accent-700"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
          Delete
        </button>
      </div>
    </div>
  );
}
