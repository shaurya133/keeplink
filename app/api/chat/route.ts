import { createAnthropic } from "@ai-sdk/anthropic";
import { streamText, type ModelMessage } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";
import { getUserFromBearer, mobileCorsHeaders } from "@/lib/mobile-auth";

const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CHAT_RATE_LIMIT = 30;
const CHAT_RATE_WINDOW_MS = 60 * 1000;
const chatRateMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const entry = chatRateMap.get(userId);
  if (!entry || now > entry.resetAt) {
    chatRateMap.set(userId, { count: 1, resetAt: now + CHAT_RATE_WINDOW_MS });
    return false;
  }
  if (entry.count >= CHAT_RATE_LIMIT) return true;
  entry.count++;
  return false;
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: mobileCorsHeaders() });
}

export async function POST(req: NextRequest) {
  // Support both cookie sessions (web) and Bearer tokens (mobile)
  const bearerUser = await getUserFromBearer(req);
  let userId: string;

  if (bearerUser) {
    userId = bearerUser.id;
  } else {
    let user: Awaited<ReturnType<typeof requireUser>>;
    try {
      user = await requireUser();
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: mobileCorsHeaders() });
    }
    userId = user.id;
  }

  if (isRateLimited(userId)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429, headers: mobileCorsHeaders() }
    );
  }

  interface ClientLinkMeta {
    id: string;
    title: string | null;
    url: string;
    domain: string;
    status: string;
    addedAt: string;
    readAt: string | null;
    tags: string[];
  }

  const { messages: rawMessages, linkId, activeTab, linksMeta } = await req.json() as {
    messages: ModelMessage[];
    linkId?: string;
    activeTab?: string;
    linksMeta?: ClientLinkMeta[];
  };
  const messages = (rawMessages ?? []).slice(-20);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  function buildClientCatalog(meta: ClientLinkMeta[], tab?: string) {
    const tabLabel: Record<string, string> = {
      unread: "Unread", read: "Read", archived: "Archived", all: "All", saved: "Offline saved",
    };
    const header = tab && tabLabel[tab]
      ? `The user is currently viewing their "${tabLabel[tab]}" tab. Showing ${meta.length} link(s):\n\n`
      : `Library snapshot (${meta.length} link(s)):\n\n`;

    const rows = meta.map((l, i) => {
      const title = l.title ?? l.url;
      const status = l.status.toLowerCase();
      const added = `added ${formatDate(l.addedAt)}`;
      const read = l.readAt ? `, read ${formatDate(l.readAt)}` : "";
      const tags = l.tags.length > 0 ? `, tags: ${l.tags.join(", ")}` : "";
      return `${i + 1}. "${title}" (${l.domain}) [${status}, ${added}${read}${tags}]`;
    }).join("\n");

    return header + rows;
  }

  let system: string;

  if (linkId) {
    const link = await prisma.link.findFirst({
      where: { id: linkId, userId },
    });

    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    const articleText = link.content
      ? link.content.slice(0, 12000)
      : link.description ?? "";

    const librarySection = linksMeta?.length
      ? `\n\n---\nFor reference, here are other articles in the user's library:\n${buildClientCatalog(linksMeta, activeTab)}`
      : "";

    system = `You are a helpful reading assistant. The user has saved an article and wants to discuss it.

Article title: ${link.title ?? link.url}
Source: ${link.domain}
URL: ${link.url}
${link.description ? `\nSummary: ${link.description}` : ""}
${articleText ? `\nArticle content:\n${articleText}` : "\n(Full article text not available — answer based on the title and summary.)"}${librarySection}

Answer the user's questions about this article. Be concise and direct. If the article content doesn't contain information needed to answer, say so. Reply in plain text only — no markdown, no bullet symbols, no bold or italic markers.`;
  } else {
    let catalog: string;

    if (linksMeta?.length) {
      catalog = buildClientCatalog(linksMeta, activeTab);
    } else {
      const dbLinks = await prisma.link.findMany({
        where: { userId },
        select: { title: true, url: true, description: true, domain: true },
        orderBy: { addedAt: "desc" },
        take: 50,
      });
      catalog = dbLinks.length
        ? dbLinks.map((l, i) => {
            const title = l.title ?? l.url;
            const desc = l.description ? ` — ${l.description.slice(0, 120)}` : "";
            return `${i + 1}. ${title} (${l.domain})${desc}`;
          }).join("\n")
        : "(No links saved yet.)";
    }

    system = `You are a helpful assistant for a personal link library. The user has saved the following links:

${catalog}

Help the user explore, recall, and make sense of their saved links. When asked what they've saved about a topic, search the list above and mention relevant titles. You know each link's status (unread/read/archived), when it was added, when it was read, and any tags — use this to answer questions like "summarize my unread articles" or "what did I read last week". Be concise. Reply in plain text only — no markdown, no bullet symbols, no bold or italic markers.`;
  }

  const result = streamText({
    model: anthropic("claude-haiku-4-5-20251001"),
    system,
    messages,
  });

  return result.toTextStreamResponse();
}
