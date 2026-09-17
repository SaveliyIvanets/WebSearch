import { describe, it, expect } from "vitest";
import { UrlNormalizerBuilder } from ".../../../src/crawler/UrlNormalizer/UrlNormalizerBuilder.js";
import { UrlNormalizer } from "../../../src/crawler/UrlNormalizer/UrlNormalizer";
import { Url } from "url";

describe("UrlNormalizer", () => {
  it("should normalize paths, hostname and strip hash/default ports", () => {
    const builder: UrlNormalizerBuilder = new UrlNormalizerBuilder();
    const normalizer: UrlNormalizer = builder.build();

    const raw = "HTTP://Example.COM:80/path/to/page/#section";
    const normalized = normalizer.normalize(raw);
    expect(normalized).toBe("http://example.com/path/to/page");
  });

  it("should strip trailing slashes for non-root paths", () => {
    const builder: UrlNormalizerBuilder = new UrlNormalizerBuilder();
    const normalizer: UrlNormalizer = builder.build()
    expect(normalizer.normalize("https://site.com/sub/")).toBe(
      "https://site.com/sub",
    );
    expect(normalizer.normalize("https://site.com/")).toBe(
      "https://site.com/",
    );
  });
  it("should return null on invalid URL", () => {
    const builder: UrlNormalizerBuilder = new UrlNormalizerBuilder();
    const normalizer: UrlNormalizer = builder.build()
    expect(normalizer.normalize("not-a-valid-url")).toBeNull();
  });
});
