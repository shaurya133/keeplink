import type { LinkWithTags } from "@/types";
import { LinkCard } from "@/components/LinkCard";

export function LinkList({ links }: { links: LinkWithTags[] }) {
  if (links.length === 0) {
    return (
      <div className="py-20 text-center opacity-60">
        <div className="mb-1.5 font-heading text-[16px] font-extrabold">No links here</div>
        <div className="text-[13px]">Try a different filter or tag, or save a new link above.</div>
      </div>
    );
  }

  return <div>{links.map((link) => <LinkCard key={link.id} link={link} />)}</div>;
}
