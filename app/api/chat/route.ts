import { createAnthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";

const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  let user: Awaited<ReturnType<typeof requireUser>>;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { messages, linkId } = await req.json();

  let system: string;

  if (linkId) {
    const link = await prisma.link.findFirst({
      where: { id: linkId, userId: user.id },
    });

    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    const articleText = link.content
      ? link.content.slice(0, 12000)
      : link.description ?? "";

    system = `You are a helpful reading assistant. The user has saved an article and wants to discuss it.

Article title: ${link.title ?? link.url}
Source: ${link.domain}
URL: ${link.url}
${link.description ? `\nSummary: ${link.description}` : ""}
${articleText ? `\nArticle content:\n${articleText}` : "\n(Full article text not available — answer based on the title and summary.)"}

Answer the user's questions about this article. Be concise and direct. If the article content doesn't contain information needed to answer, say so. Reply in plain text only — no markdown, no bullet symbols, no bold or italic markers.`;
  } else {
    const links = await prisma.link.findMany({
      where: { userId: user.id },
      select: { title: true, url: true, description: true, domain: true },
      orderBy: { addedAt: "desc" },
    });

    const catalog = links
      .map((l, i) => {
        const title = l.title ?? l.url;
        const desc = l.description ? ` — ${l.description.slice(0, 120)}` : "";
        return `${i + 1}. ${title} (${l.domain})${desc}`;
      })
      .join("\n");

    system = `You are a helpful assistant for a personal link library. The user has saved the following links:

${catalog || "(No links saved yet.)"}

Help the user explore, recall, and make sense of their saved links. When asked what they've saved about a topic, search the list above and mention relevant titles. Be concise. Reply in plain text only — no markdown, no bullet symbols, no bold or italic markers.`;
  }

  const result = streamText({
    model: anthropic("claude-haiku-4-5-20251001"),
    system,
    messages,
  });

  return result.toTextStreamResponse();
}
