import { describe, it, expect } from "vitest";
import { UrlNormalizerBuilder } from "../../../src/crawler/UrlNormalizer/UrlNormalizerBuilder.js";

describe("UrlNormalizer", () => {
  // ============================================================
  // БАЗОВЫЕ ТЕСТЫ (существующие + дополненные)
  // ============================================================

  describe("basic normalization", () => {
    it("should normalize paths, hostname and strip hash/default ports", () => {
      const normalizer = new UrlNormalizerBuilder().build();
      const raw = "HTTP://Example.COM:80/path/to/page/#section";
      const normalized = normalizer.normalize(raw);
      expect(normalized).toBe("http://example.com/path/to/page");
    });

    it("should strip trailing slashes for non-root paths", () => {
      const normalizer = new UrlNormalizerBuilder().build();
      expect(normalizer.normalize("https://site.com/sub/")).toBe(
        "https://site.com/sub",
      );
      expect(normalizer.normalize("https://site.com/")).toBe(
        "https://site.com/",
      );
    });

    it("should return null on invalid URL", () => {
      const normalizer = new UrlNormalizerBuilder().build();
      expect(normalizer.normalize("not-a-valid-url")).toBeNull();
    });

    it("should strip default port 443 for https", () => {
      const normalizer = new UrlNormalizerBuilder().build();
      expect(normalizer.normalize("https://example.com:443/page")).toBe(
        "https://example.com/page",
      );
    });

    it("should keep non-default ports", () => {
      const normalizer = new UrlNormalizerBuilder().build();
      expect(normalizer.normalize("https://example.com:8443/page")).toBe(
        "https://example.com:8443/page",
      );
      expect(normalizer.normalize("http://example.com:8080/page")).toBe(
        "http://example.com:8080/page",
      );
    });

    it("should lowercase hostname", () => {
      const normalizer = new UrlNormalizerBuilder().build();
      expect(normalizer.normalize("https://EXAMPLE.COM/Page")).toBe(
        "https://example.com/Page",
      );
    });

    it("should remove fragment", () => {
      const normalizer = new UrlNormalizerBuilder().build();
      expect(normalizer.normalize("https://example.com/page#section")).toBe(
        "https://example.com/page",
      );
    });
  });

  // ============================================================
  // 1. QUERY NORMALIZATION
  // ============================================================

  describe("query normalization", () => {
    describe("sortQuery", () => {
      it("should sort query params alphabetically when enabled", () => {
        const normalizer = new UrlNormalizerBuilder()
          .withSortQuery(true)
          .withTrackingRemoval(false)
          .build();

        expect(normalizer.normalize("https://example.com/?b=2&a=1&c=3")).toBe(
          "https://example.com/?a=1&b=2&c=3",
        );
      });

      it("should NOT sort query params when disabled", () => {
        const normalizer = new UrlNormalizerBuilder()
          .withSortQuery(false)
          .withTrackingRemoval(false)
          .build();

        expect(normalizer.normalize("https://example.com/?b=2&a=1&c=3")).toBe(
          "https://example.com/?b=2&a=1&c=3",
        );
      });
    });

    describe("removeEmptyParams", () => {
      it("should remove empty query params when enabled", () => {
        const normalizer = new UrlNormalizerBuilder()
          .withEmptyParamsRemoval(true)
          .withSortQuery(false)
          .withTrackingRemoval(false)
          .build();

        expect(normalizer.normalize("https://example.com/?a=1&b=&c=3")).toBe(
          "https://example.com/?a=1&c=3",
        );
      });

      it("should keep empty params when disabled", () => {
        const normalizer = new UrlNormalizerBuilder()
          .withEmptyParamsRemoval(false)
          .withSortQuery(false)
          .withTrackingRemoval(false)
          .build();

        expect(normalizer.normalize("https://example.com/?a=1&b=&c=3")).toBe(
          "https://example.com/?a=1&b=&c=3",
        );
      });
    });

    describe("removeTrackingParams", () => {
      it("should remove default tracking params when enabled", () => {
        const normalizer = new UrlNormalizerBuilder()
          .withTrackingRemoval(true)
          .withSortQuery(false)
          .withEmptyParamsRemoval(false)
          .build();

        const input =
          "https://example.com/?a=1&utm_source=twitter&b=2&fbclid=xyz&gclid=abc";
        expect(normalizer.normalize(input)).toBe(
          "https://example.com/?a=1&b=2",
        );
      });

      it("should NOT remove tracking params when disabled", () => {
        const normalizer = new UrlNormalizerBuilder()
          .withTrackingRemoval(false)
          .withSortQuery(false)
          .withEmptyParamsRemoval(false)
          .build();

        const input = "https://example.com/?a=1&utm_source=twitter&b=2";
        expect(normalizer.normalize(input)).toBe(
          "https://example.com/?a=1&utm_source=twitter&b=2",
        );
      });

      it("should use custom tracking params", () => {
        const normalizer = new UrlNormalizerBuilder()
          .withTrackingRemoval(true)
          .withCustomTrackingParams(new Set(["custom_track", "my_param"]))
          .withSortQuery(false)
          .withEmptyParamsRemoval(false)
          .build();

        const input =
          "https://example.com/?a=1&custom_track=x&my_param=y&b=2";
        expect(normalizer.normalize(input)).toBe(
          "https://example.com/?a=1&b=2",
        );
      });

      it("should not remove utm_source when custom list excludes it", () => {
        const normalizer = new UrlNormalizerBuilder()
          .withTrackingRemoval(true)
          .withCustomTrackingParams(new Set(["custom_only"]))
          .withSortQuery(false)
          .withEmptyParamsRemoval(false)
          .build();

        const input = "https://example.com/?a=1&utm_source=twitter&custom_only=x";
        expect(normalizer.normalize(input)).toBe(
          "https://example.com/?a=1&utm_source=twitter",
        );
      });
    });

    describe("duplicate params", () => {
      it("should keep FIRST duplicate by default", () => {
        const normalizer = new UrlNormalizerBuilder()
          .withKeepFirstDuplicates()
          .withSortQuery(false)
          .withTrackingRemoval(false)
          .withEmptyParamsRemoval(false)
          .build();

        expect(
          normalizer.normalize("https://example.com/?a=1&b=2&a=3"),
        ).toBe("https://example.com/?a=1&b=2");
      });

      it("should keep LAST duplicate when configured", () => {
        const normalizer = new UrlNormalizerBuilder()
          .withKeepLastDuplicates()
          .withSortQuery(false)
          .withTrackingRemoval(false)
          .withEmptyParamsRemoval(false)
          .build();

        expect(
          normalizer.normalize("https://example.com/?a=1&b=2&a=3"),
        ).toBe("https://example.com/?a=3&b=2");
      });

      it("should merge duplicates with comma by default", () => {
        const normalizer = new UrlNormalizerBuilder()
          .withMergeDuplicates()
          .withSortQuery(false)
          .withTrackingRemoval(false)
          .withEmptyParamsRemoval(false)
          .build();

        expect(
          normalizer.normalize("https://example.com/?a=1&b=2&a=3"),
        ).toBe("https://example.com/?a=1,3&b=2");
      });

      it("should merge duplicates with custom separator", () => {
        const normalizer = new UrlNormalizerBuilder()
          .withMergeDuplicates("|")
          .withSortQuery(false)
          .withTrackingRemoval(false)
          .withEmptyParamsRemoval(false)
          .build();

        expect(
          normalizer.normalize("https://example.com/?a=1&a=2&a=3"),
        ).toBe("https://example.com/?a=1|2|3");
      });
    });

    describe("combined query normalization", () => {
      it("should apply all query options together", () => {
        const normalizer = new UrlNormalizerBuilder()
          .withSortQuery(true)
          .withTrackingRemoval(true)
          .withEmptyParamsRemoval(true)
          .withKeepFirstDuplicates()
          .build();

        const input =
          "https://example.com/?b=2&a=1&utm_source=twitter&a=3&c=&d=4";
        expect(normalizer.normalize(input)).toBe(
          "https://example.com/?a=1&b=2&d=4",
        );
      });
    });
  });

  // ============================================================
  // 2. PERCENT ENCODING NORMALIZATION
  // ============================================================

  describe("percent encoding normalization", () => {
    it("should decode percent-encoded unreserved characters", () => {
      const normalizer = new UrlNormalizerBuilder().build();
      expect(
        normalizer.normalize("https://example.com/%68%65%6c%6c%6f"),
      ).toBe("https://example.com/hello");
    });

    it("should decode unreserved chars but keep reserved encoded", () => {
      const normalizer = new UrlNormalizerBuilder().build();
      // %20 (space) — unreserved-unsafe, должен остаться закодированным
      expect(
        normalizer.normalize(
          "https://example.com/%68%65%6c%6c%6f%20world",
        ),
      ).toBe("https://example.com/hello%20world");
    });

    it("should uppercase percent-encoded triplets", () => {
      const normalizer = new UrlNormalizerBuilder().build();
      expect(normalizer.normalize("https://example.com/a%2fb%3ac")).toBe(
        "https://example.com/a%2Fb%3Ac",
      );
    });

    it("should NOT double-encode already encoded characters", () => {
      const normalizer = new UrlNormalizerBuilder().build();
      expect(normalizer.normalize("https://example.com/hello%20world")).toBe(
        "https://example.com/hello%20world",
      );
    });

    it("should encode spaces in pathname", () => {
      const normalizer = new UrlNormalizerBuilder().build();
      expect(normalizer.normalize("https://example.com/hello world")).toBe(
        "https://example.com/hello%20world",
      );
    });

    it("should be idempotent for pathname encoding", () => {
      const normalizer = new UrlNormalizerBuilder().build();
      const once = normalizer.normalize(
        "https://example.com/%68%65%6c%6c%6f%20world",
      );
      const twice = normalizer.normalize(once!);
      expect(twice).toBe(once);
    });
  });

  // ============================================================
  // 3. UNICODE / IDN HOSTNAME SUPPORT
  // ============================================================

  describe("IDN hostname support", () => {
    it("should convert Cyrillic hostname to Punycode", () => {
      const normalizer = new UrlNormalizerBuilder().build();
      expect(normalizer.normalize("https://яндекс.рф/")).toBe(
        "https://xn--d1acpjx3f.xn--p1ai/",
      );
    });

    it("should convert Chinese hostname to Punycode", () => {
      const normalizer = new UrlNormalizerBuilder().build();
      const result = normalizer.normalize("https://中国.中国/");
      expect(result).toBe("https://xn--fiqs8s.xn--fiqs8s/");
    });

    it("should convert Arabic hostname to Punycode", () => {
      const normalizer = new UrlNormalizerBuilder().build();
      const result = normalizer.normalize("https://مثال.إختبار/");
      expect(result).toBe("https://xn--mgbh0fb.xn--kgbechtv/");
    });

    it("should not modify ASCII hostnames", () => {
      const normalizer = new UrlNormalizerBuilder().build();
      expect(normalizer.normalize("https://example.com/")).toBe(
        "https://example.com/",
      );
    });
  });

  // ============================================================
  // 4. WWW NORMALIZATION
  // ============================================================

  describe("WWW normalization", () => {
    it("should remove www. when strategy is 'remove'", () => {
      const normalizer = new UrlNormalizerBuilder().withWWWRemoval().build();
      expect(normalizer.normalize("https://www.example.com/page")).toBe(
        "https://example.com/page",
      );
    });

    it("should add www. when strategy is 'add'", () => {
      const normalizer = new UrlNormalizerBuilder().withWWWAddition().build();
      expect(normalizer.normalize("https://example.com/page")).toBe(
        "https://www.example.com/page",
      );
    });

    it("should keep www. when strategy is 'keep'", () => {
      const normalizer = new UrlNormalizerBuilder().withWWWKeep().build();
      expect(normalizer.normalize("https://www.example.com/page")).toBe(
        "https://www.example.com/page",
      );
      expect(normalizer.normalize("https://example.com/page")).toBe(
        "https://example.com/page",
      );
    });

    it("should remove www. from subdomains", () => {
      const normalizer = new UrlNormalizerBuilder().withWWWRemoval().build();
      expect(normalizer.normalize("https://www.sub.example.com/page")).toBe(
        "https://sub.example.com/page",
      );
    });

    it("should not touch www without dot", () => {
      const normalizer = new UrlNormalizerBuilder().withWWWRemoval().build();
      expect(normalizer.normalize("https://wwwexample.com/page")).toBe(
        "https://wwwexample.com/page",
      );
    });
  });

  // ============================================================
  // EDGE CASES
  // ============================================================

  describe("edge cases", () => {
    it("should handle URL without query", () => {
      const normalizer = new UrlNormalizerBuilder().build();
      expect(normalizer.normalize("https://example.com/page")).toBe(
        "https://example.com/page",
      );
    });

    it("should handle URL with empty query", () => {
      const normalizer = new UrlNormalizerBuilder().build();
      expect(normalizer.normalize("https://example.com/page?")).toBe(
        "https://example.com/page",
      );
    });

    it("should handle URL with root path", () => {
      const normalizer = new UrlNormalizerBuilder().build();
      expect(normalizer.normalize("https://example.com/")).toBe(
        "https://example.com/",
      );
    });

    it("should handle URL without path", () => {
      const normalizer = new UrlNormalizerBuilder().build();
      expect(normalizer.normalize("https://example.com")).toBe(
        "https://example.com/",
      );
    });

    it("should be idempotent", () => {
      const normalizer = new UrlNormalizerBuilder()
        .withSortQuery(true)
        .withTrackingRemoval(true)
        .withWWWRemoval()
        .build();

      const input =
        "https://www.example.com/path?b=2&utm_source=x&a=1#frag";
      const once = normalizer.normalize(input);
      const twice = normalizer.normalize(once!);
      const thrice = normalizer.normalize(twice!);

      expect(once).toBe(twice);
      expect(twice).toBe(thrice);
    });

    it("should return null for empty string", () => {
      const normalizer = new UrlNormalizerBuilder().build();
      expect(normalizer.normalize("")).toBeNull();
    });

    it("should return null for malformed URL", () => {
      const normalizer = new UrlNormalizerBuilder().build();
      expect(normalizer.normalize("ht!tp://bad url")).toBeNull();
      expect(normalizer.normalize("://missing-scheme")).toBeNull();
    });

    it("should handle URL with only hostname and port", () => {
      const normalizer = new UrlNormalizerBuilder().build();
      expect(normalizer.normalize("https://example.com:443")).toBe(
        "https://example.com/",
      );
    });

    it("should preserve non-ASCII path even with punycode support", () => {
      const normalizer = new UrlNormalizerBuilder().build();
      const result = normalizer.normalize("https://example.com/привет");
      // Путь кодируется percent-encoding, а не Punycode
      expect(result).toContain("%D0%BF%D1%80%D0%B8%D0%B2%D0%B5%D1%82");
    });
  });
});