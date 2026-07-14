"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createLink } from "@/app/(app)/links/actions";

export function LinkForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const url = inputRef.current?.value.trim();
    if (!url) return;

    setError(null);
    startTransition(async () => {
      const result = await createLink(url);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mb-[var(--space-3)] space-y-2">
      <div className="flex gap-[var(--space-2)]">
        <input
          ref={inputRef}
          type="url"
          required
          placeholder="Paste a URL to save"
          className="input flex-1"
        />
        <button type="submit" disabled={isPending} className="btn btn-primary">
          {isPending ? "Saving..." : "Save"}
        </button>
      </div>
      {error && <p className="text-sm text-accent-700">{error}</p>}
    </form>
  );
}
