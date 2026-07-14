import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import * as cheerio from "cheerio";

export function extractContent(html: string, url: string): string | null {
  try {
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    if (article?.textContent) {
      return article.textContent.replace(/\s+/g, " ").trim();
    }
  } catch {
    // fall through to cheerio fallback
  }

  try {
    const $ = cheerio.load(html);
    const text = $("body").text().replace(/\s+/g, " ").trim();
    return text || null;
  } catch {
    return null;
  }
}
