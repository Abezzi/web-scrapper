import { URL } from "node:url";
import { JSDOM } from "jsdom";

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
