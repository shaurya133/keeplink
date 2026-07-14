"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createLink } from "@/app/(app)/links/actions";

function isHttpUrl(text: string) {
  try {
    const parsed = new URL(text);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function LinkOmniBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setValue(searchParams.get("q") ?? "");
  }, [searchParams]);

  function updateSearch(next: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (next) params.set("q", next);
      else params.delete("q");
      router.push(`${pathname}?${params.toString()}`);
    }, 300);
  }

  function save(url: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setError(null);
    startSaving(async () => {
      const result = await createLink(url);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setValue("");
      const params = new URLSearchParams(searchParams.toString());
      params.delete("q");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
      router.refresh();
    });
  }

  function handleChange(next: string) {
    setValue(next);
    setError(null);
    updateSearch(next);
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").trim();
    if (isHttpUrl(pasted)) {
      e.preventDefault();
      setValue(pasted);
      save(pasted);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && isHttpUrl(value.trim())) {
      e.preventDefault();
      save(value.trim());
    }
  }

  return (
    <div className="mb-[var(--space-6)] space-y-2">
      <input
        type="search"
        value={value}
        disabled={isSaving}
        onChange={(e) => handleChange(e.target.value)}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        placeholder="Paste a URL to save, or search your links"
        className="input w-full"
      />
      {isSaving && <p className="text-sm opacity-65">Saving...</p>}
      {error && <p className="text-sm text-accent-700">{error}</p>}
    </div>
  );
}
