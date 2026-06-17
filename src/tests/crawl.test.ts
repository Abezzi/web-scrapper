import { describe, it, expect } from "vitest";
import { getImagesFromHTML, getURLsFromHTML, normalizeUrl } from "../crawl";

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

describe("getURLsFromHTML", () => {
  const baseURL = "https://www.boot.dev";

  it("converts relative URLs to absolute", () => {
    const html = `<html><body><a href="/blog/path">Link</a></body></html>`;
    expect(getURLsFromHTML(html, baseURL)).toEqual([
      "https://www.boot.dev/blog/path",
    ]);
  });

  it("handles absolute URLs", () => {
    const html = `<html><body><a href="https://example.com">External</a></body></html>`;
    expect(getURLsFromHTML(html, baseURL)).toEqual(["https://example.com/"]);
  });

  it("skips invalid and missing hrefs", () => {
    const html = `<html><body><a>no href</a><a href="invalid url">bad</a></body></html>`;
    expect(getURLsFromHTML(html, baseURL)).toEqual([]);
  });
});

describe("getImagesFromHTML", () => {
  const baseURL = "https://www.boot.dev";

  it("converts relative image src to absolute", () => {
    const html = `<html><body><img src="/assets/logo.png" alt="logo"></body></html>`;
    expect(getImagesFromHTML(html, baseURL)).toEqual([
      "https://www.boot.dev/assets/logo.png",
    ]);
  });

  it("handles absolute image URLs", () => {
    const html = `<html><body><img src="https://cdn.com/img.jpg"></body></html>`;
    expect(getImagesFromHTML(html, baseURL)).toEqual([
      "https://cdn.com/img.jpg",
    ]);
  });

  it("skips missing src attributes", () => {
    const html = `<html><body><img alt="no src"></body></html>`;
    expect(getImagesFromHTML(html, baseURL)).toEqual([]);
  });
});
