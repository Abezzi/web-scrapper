import { URL } from "node:url";
import { JSDOM } from "jsdom";
import { ExtractedPageData } from "./types/ExtractedPageData";

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

export async function crawlPage(
  baseURL: string,
  currentURL: string = baseURL,
  pages: Record<string, number> = {},
): Promise<Record<string, number>> {
  if (!isSameDomain(baseURL, currentURL)) {
    return pages;
  }

  const normalizedCurrent = normalizeUrl(currentURL);

  if (pages[normalizedCurrent] !== undefined) {
    pages[normalizedCurrent]++;
    return pages;
  }

  pages[normalizedCurrent] = 1;
  console.log(`Crawling: ${currentURL}`);

  let html: string;
  try {
    const response = await fetch(currentURL, {
      headers: { "User-Agent": "BootCrawler/1.0" },
    });

    if (response.status >= 400) {
      console.error(`ERROR: HTTP status ${response.status} for ${currentURL}`);
      return pages;
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("text/html")) {
      console.error(`ERROR: Content type is not HTML for ${currentURL}`);
      return pages;
    }

    html = await response.text();
  } catch (error) {
    console.error(`ERROR fetching ${currentURL}:`, error);
    return pages;
  }

  const urls = getURLsFromHTML(html, currentURL);

  for (const url of urls) {
    await crawlPage(baseURL, url, pages);
  }

  return pages;
}
