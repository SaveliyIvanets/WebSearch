import { UrlNormalizer } from "./UrlNormalizer.js";
class LinkExtractor {
  static extractInternalLinks($, currentUrl, baseHostname) {
    const internalLinks = new Set();
    $("a").each((i, el) => {
      const href = $(el).attr("href");
      if (this._isIgnoredLink(href)) return;
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
  static _isIgnoredLink(href) {
    return (
      !href ||
      href.startsWith("#") ||
      href.startsWith("mailto:") ||
      href.startsWith("javascript:") ||
      href.startsWith("tel:") ||
      href.startsWith("sms:") ||
      href.startsWith("data:")
    );
  }
}
export { LinkExtractor };
