import type { Link, Tag } from "@prisma/client";

export type LinkWithTags = Link & {
  tags: { tag: Tag }[];
};
