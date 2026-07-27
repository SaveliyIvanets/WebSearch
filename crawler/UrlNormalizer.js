const { URL } = require("url");
class UrlNormalizer {
  static normalize(rawUrl) {
    try {
      const normalized = new URL(rawUrl);
      normalized.hash = "";
      if (
        (normalized.protocol === "http:" && normalized.port === "80") ||
        (normalized.protocol === "https:" && normalized.port === "443")
      ) {
        normalized.port = "";
      }
      if (normalized.pathname !== "/" && normalized.pathname.endsWith("/")) {
        normalized.pathname = normalized.pathname.replace(/\/+$/, "");
      }
      normalized.hostname = normalized.hostname.toLowerCase();
      return normalized.href;
    } catch (e) {
      return null;
    }
  }
}
module.exports = { UrlNormalizer };
