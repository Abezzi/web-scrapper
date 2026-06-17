import { describe, it, expect, beforeAll } from "vitest";
import { normalizeUrl } from "../crawl";

describe("normalizeUrl", () => {
  const validUrl = "www.boot.dev/blog/path";
  const nonNormalizedUrls = [
    "https://www.boot.dev/blog/path/",
    "https://www.boot.dev/blog/path",
    "http://www.boot.dev/blog/path/",
    "http://www.boot.dev/blog/path",
    "www.boot.dev/blog/path/",
    "www.boot.dev/blog/path",
  ];

  it.each(nonNormalizedUrls)("should normalize %s", (url) => {
    expect(normalizeUrl(url)).toBe(validUrl);
  });
});
