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

import { getHeadingFromHTML, getFirstParagraphFromHTML } from "../crawl";

describe("getHeadingFromHTML", () => {
  it("returns h1 text when present", () => {
    const html = `<html><body><h1>Boot.dev Course</h1></body></html>`;
    expect(getHeadingFromHTML(html)).toBe("Boot.dev Course");
  });

  it("falls back to h2 when no h1", () => {
    const html = `<html><body><h2>Secondary Title</h2></body></html>`;
    expect(getHeadingFromHTML(html)).toBe("Secondary Title");
  });

  it("returns empty string when no heading", () => {
    const html = `<html><body><p>No heading</p></body></html>`;
    expect(getHeadingFromHTML(html)).toBe("");
  });
});

describe("getFirstParagraphFromHTML", () => {
  it("returns first p inside main when present", () => {
    const html = `
      <html><body>
        <p>Outside</p>
        <main><p>Main content paragraph.</p></main>
      </body></html>`;
    expect(getFirstParagraphFromHTML(html)).toBe("Main content paragraph.");
  });

  it("returns first p when no main", () => {
    const html = `<html><body><p>First paragraph text.</p><p>Second</p></body></html>`;
    expect(getFirstParagraphFromHTML(html)).toBe("First paragraph text.");
  });

  it("returns empty string when no p tag", () => {
    const html = `<html><body><h1>Title</h1></body></html>`;
    expect(getFirstParagraphFromHTML(html)).toBe("");
  });
});
