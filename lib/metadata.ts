import * as cheerio from "cheerio";
import { estimateReadingTime } from "@/lib/reading-time";
import { extractContent } from "@/lib/content-extractor";

export interface FetchedMetadata {
  title: string | null;
  description: string | null;
  thumbnail: string | null;
  favicon: string | null;
  domain: string;
  readingTime: number | null;
  content: string | null;
}

function extractDomain(url: string): string {
  return new URL(url).hostname.replace(/^www\./, "");
}

function resolveUrl(maybeRelative: string, base: string): string | null {
  try {
    return new URL(maybeRelative, base).toString();
  } catch {
    return null;
  }
}

export async function fetchMetadata(url: string): Promise<FetchedMetadata> {
  const domain = extractDomain(url);
  const empty: FetchedMetadata = {
    title: null,
    description: null,
    thumbnail: null,
    favicon: null,
    domain,
    readingTime: null,
    content: null,
  };

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; KeepLinkBot/1.0)",
      },
    });

    const contentType = response.headers.get("content-type") ?? "";
    if (!response.ok || !contentType.includes("text/html")) {
      return empty;
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const finalUrl = response.url || url;

    const title =
      $('meta[property="og:title"]').attr("content")?.trim() ||
      $("title").first().text().trim() ||
      null;

    const description =
      $('meta[property="og:description"]').attr("content")?.trim() ||
      $('meta[name="description"]').attr("content")?.trim() ||
      null;

    const rawThumbnail = $('meta[property="og:image"]').attr("content");
    const thumbnail = rawThumbnail ? resolveUrl(rawThumbnail, finalUrl) : null;

    const rawFavicon =
      $('link[rel="icon"]').attr("href") ||
      $('link[rel="shortcut icon"]').attr("href") ||
      "/favicon.ico";
    const favicon = resolveUrl(rawFavicon, finalUrl);

    const bodyText = $("body").text().replace(/\s+/g, " ").trim();
    const readingTime = bodyText ? estimateReadingTime(bodyText) : null;
    const content = extractContent(html, finalUrl);

    return { title, description, thumbnail, favicon, domain, readingTime, content };
  } catch {
    return empty;
  }
}
