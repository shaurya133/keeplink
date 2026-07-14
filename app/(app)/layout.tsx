import { requireUser } from "@/lib/auth-helpers";
import { Nav } from "@/components/Nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <Nav email={user.email ?? ""} />
      {children}
    </div>
  );
}
