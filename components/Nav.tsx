import { SignOutButton } from "@/components/SignOutButton";
import { NavChatButton } from "@/components/NavChatButton";

export function Nav({ email }: { email: string }) {
  return (
    <nav className="nav">
      <div className="mr-auto flex items-center gap-2.5">
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center bg-accent">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-bg)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.5 1.5" />
            <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.5-1.5" />
          </svg>
        </div>
        <span className="nav-brand">KeepLink</span>
      </div>
      <span className="hidden text-[13px] text-ink opacity-65 sm:inline">{email}</span>
      <NavChatButton />
      <SignOutButton />
    </nav>
  );
}
