import { URL } from "node:url";

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
