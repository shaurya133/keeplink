import { requireUser } from "@/lib/auth-helpers";
import { Nav } from "@/components/Nav";
import { ChatProvider } from "@/components/ChatToggle";
import { ChatPanel } from "@/components/ChatPanel";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  return (
    <ChatProvider>
      <div className="flex min-h-screen flex-col bg-canvas text-ink">
        <Nav email={user.email ?? ""} />
        {children}
      </div>
      <ChatPanel />
    </ChatProvider>
  );
}
