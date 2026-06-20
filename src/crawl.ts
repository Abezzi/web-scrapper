import { URL } from "node:url";
import { JSDOM } from "jsdom";
import { ExtractedPageData } from "./types/ExtractedPageData";
import pLimit from "p-limit";

/**
 * url examples:
 * https://www.boot.dev/blog/path/
 * https://www.boot.dev/blog/path
 * http://www.boot.dev/blog/path/
 * http://www.boot.dev/blog/path
 * should return: www.boot.dev/blog/path
 * @param url - a non-normalized url string
 * @returns normalized url string
 */
export function normalizeUrl(url: string) {
  let normalized = url.trim();

  // in case its an empty string
  if (!normalized) return "";

  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `https://${normalized}`;
  }

  const parsed = new URL(normalized);

  let result = parsed.hostname + parsed.pathname;

  // remove trailing slash
  result = result.replace(/\/$/, "");

  return result;
}

export function getHeadingFromHTML(html: string): string {
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  const h1 = doc.querySelector("h1");
  if (h1?.textContent) return h1.textContent.trim();

  const h2 = doc.querySelector("h2");
  if (h2?.textContent) return h2.textContent.trim();

  return "";
}

export function getFirstParagraphFromHTML(html: string): string {
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  // prefer <main> if exists
  const main = doc.querySelector("main");
  const container = main || doc.body || doc;

  const p = container.querySelector("p");
  return p?.textContent?.trim() || "";
}

export function getURLsFromHTML(html: string, baseURL: string): string[] {
  const urls: string[] = [];
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  const anchors = doc.querySelectorAll("a");

  for (const anchor of anchors) {
    const href = anchor.getAttribute("href");
    if (!href || !href.trim()) continue;

    try {
      const resolved = new URL(href, baseURL).toString();
      // additional validation to skip clearly malformed URLs
      if (resolved && !resolved.includes("invalid%20url")) {
        urls.push(resolved);
      }
    } catch (_) {
      // skip invalid URLs
    }
  }

  return urls;
}

export function getImagesFromHTML(html: string, baseURL: string): string[] {
  const images: string[] = [];
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  const imgs = doc.querySelectorAll("img");

  for (const img of imgs) {
    const src = img.getAttribute("src");
    if (!src || !src.trim()) continue;

    try {
      const resolved = new URL(src, baseURL).toString();
      images.push(resolved);
    } catch (_) {
      // skip invalid image URLs
    }
  }

  return images;
}

export function extractPageData(
  html: string,
  pageURL: string,
): ExtractedPageData {
  let extractedPageData: ExtractedPageData = {
    url: pageURL,
    heading: getHeadingFromHTML(html),
    first_paragraph: getFirstParagraphFromHTML(html),
    outgoing_links: getURLsFromHTML(html, pageURL),
    image_urls: getImagesFromHTML(html, pageURL),
  };

  return extractedPageData;
}

export async function getHTML(url: string): Promise<void> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "BootCrawler/1.0",
      },
    });

    if (response.status >= 400) {
      console.error(`ERROR: HTTP status ${response.status}`);
      return;
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("text/html")) {
      console.error(`ERROR: Content type is not HTML: ${contentType}`);
      return;
    }

    const html = await response.text();
    console.log(html);
  } catch (error) {
    console.error("ERROR fetching HTML:", error);
  }
}

export function isSameDomain(baseURL: string, currentURL: string): boolean {
  try {
    const base = new URL(baseURL);
    const current = new URL(currentURL);
    return base.hostname === current.hostname;
  } catch {
    return false;
  }
}

export class ConcurrentCrawler {
  private baseURL: string;
  private pages: Record<string, number> = {};
  private limit: ReturnType<typeof pLimit>;

  constructor(baseURL: string, maxConcurrency: number = 3) {
    this.baseURL = baseURL;
    this.limit = pLimit(maxConcurrency);
  }

  private addPageVisit(normalizedURL: string): boolean {
    if (this.pages[normalizedURL] !== undefined) {
      this.pages[normalizedURL]++;
      return false;
    }
    this.pages[normalizedURL] = 1;
    return true;
  }

  private async getHTML(currentURL: string): Promise<string> {
    return await this.limit(async () => {
      try {
        const response = await fetch(currentURL, {
          headers: { "User-Agent": "BootCrawler/1.0" },
        });

        if (response.status >= 400) {
          console.error(
            `ERROR: HTTP status ${response.status} for ${currentURL}`,
          );
          return "";
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("text/html")) {
          console.error(`ERROR: Content type is not HTML for ${currentURL}`);
          return "";
        }

        return await response.text();
      } catch (error) {
        console.error(`ERROR fetching ${currentURL}:`, error);
        return "";
      }
    });
  }

  private async crawlPage(currentURL: string): Promise<void> {
    if (!isSameDomain(this.baseURL, currentURL)) return;

    const normalized = normalizeUrl(currentURL);
    if (!this.addPageVisit(normalized)) return;

    console.log(`Crawling: ${currentURL}`);

    const html = await this.getHTML(currentURL);
    if (!html) return;

    const urls = getURLsFromHTML(html, currentURL);
    const promises = urls.map((url) => this.crawlPage(url));
    await Promise.all(promises);
  }

  public async crawl(): Promise<Record<string, number>> {
    await this.crawlPage(this.baseURL);
    return this.pages;
  }
}

export async function crawlSiteAsync(
  baseURL: string,
  maxConcurrency: number = 5,
): Promise<Record<string, number>> {
  const crawler = new ConcurrentCrawler(baseURL, maxConcurrency);
  return await crawler.crawl();
}
