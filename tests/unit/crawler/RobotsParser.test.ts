import { describe, it, expect, vi } from "vitest";
import { RobotsParser } from "../../../src/crawler/RobotsParser.js";
import { PageFetcher } from "../../../src/crawler/PageFetcher.js";

describe("RobotsParser", () => {
  it("should correctly parse disallow rules and evaluate canVisit", async () => {
    const mockFetcher = {
      userAgent: "SearchBot/1.0",
      fetchText: vi.fn().mockResolvedValue(`
        User-agent: SearchBot/1.0
        Disallow: /admin/
        Allow: /admin/public/
        Crawl-delay: 2
      `),
    } as unknown as PageFetcher;

    const parser = new RobotsParser(mockFetcher);
    await parser.load("https://example.com");

    expect(parser.canVisit("https://example.com/admin/settings")).toBe(false);
    expect(parser.canVisit("https://example.com/admin/public/page")).toBe(true);
    expect(parser.canVisit("https://example.com/home")).toBe(true);
    expect(parser.getCrawlDelay()).toBe(2000);
  });
});
