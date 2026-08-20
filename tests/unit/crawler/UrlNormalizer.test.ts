import { describe, it, expect } from "vitest";
import { UrlNormalizer } from "../../../src/crawler/UrlNormalizer.js";

describe("UrlNormalizer", () => {
  it("should normalize paths, hostname and strip hash/default ports", () => {
    const raw = "HTTP://Example.COM:80/path/to/page/#section";
    const normalized = UrlNormalizer.normalize(raw);
    expect(normalized).toBe("http://example.com/path/to/page");
  });

  it("should strip trailing slashes for non-root paths", () => {
    expect(UrlNormalizer.normalize("https://site.com/sub/")).toBe(
      "https://site.com/sub",
    );
    expect(UrlNormalizer.normalize("https://site.com/")).toBe(
      "https://site.com/",
    );
  });

  it("should return null on invalid URL", () => {
    expect(UrlNormalizer.normalize("not-a-valid-url")).toBeNull();
  });
});
