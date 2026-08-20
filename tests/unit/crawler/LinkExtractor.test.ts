import { describe, it, expect } from "vitest";
import { LinkExtractor } from "../../../src/crawler/LinkExtractor.js";
import { HtmlParser } from "../../../src/crawler/HtmlParser.js";

describe("LinkExtractor", () => {
  const linkExtractor = new LinkExtractor();
  const htmlParser = new HtmlParser();

  it("should extract internal links and ignore external or invalid protocols", () => {
    const html = `
      <a href="/about">About Us</a>
      <a href="https://mysite.com/contact/">Contact</a>
      <a href="https://external.com/page">External</a>
      <a href="javascript:void(0)">JS</a>
      <a href="#section">Hash</a>
    `;

    const { $ } = htmlParser.parse(html);
    const links = linkExtractor.extractInternalLinks(
      $,
      "https://mysite.com",
      "mysite.com",
    );

    expect(links.has("https://mysite.com/about")).toBe(true);
    expect(links.has("https://mysite.com/contact")).toBe(true);
    expect(links.has("https://external.com/page")).toBe(false);
    expect(links.size).toBe(2);
  });
});
