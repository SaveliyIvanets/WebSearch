import { UrlNormalizer } from "./UrlNormalizer.js";
import { CheerioAPI } from "cheerio";
class LinkExtractor {
  static extractInternalLinks(
    $: CheerioAPI,
    currentUrl: string,
    baseHostname: string,
  ): Set<string> {
    const internalLinks = new Set<string>();
    $("a").each((_, el) => {
      const href = $(el).attr("href");
      if (!LinkExtractor._isValidLink(href)) return;
      try {
        const absoluteUrl = new URL(href, currentUrl);
        if (absoluteUrl.hostname !== baseHostname) {
          return;
        }
        const normalized = UrlNormalizer.normalize(absoluteUrl.href);
        if (normalized) {
          internalLinks.add(normalized);
        }
      } catch (err) {
        // ignore invalid URLs
      }
    });
    return internalLinks;
  }
  private static _isValidLink(href: string | null | undefined): href is string {
    if (!href) return false;

    const ignoredPrefixes = [
      "#",
      "mailto:",
      "javascript:",
      "tel:",
      "sms:",
      "data:",
    ];
    return !ignoredPrefixes.some((prefix) => href.startsWith(prefix));
  }
}
export { LinkExtractor };
