import { Logger } from "../logger/Logger.js";

const logger = new Logger({ prefix: "UrlNormalizer" });

class UrlNormalizer {
  static normalize(rawUrl: string): string | null {
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
      logger.debug("URL normalized", { rawUrl, normalized: normalized.href });
      return normalized.href;
    } catch (e) {
      logger.warn("Invalid URL", { rawUrl });
      return null;
    }
  }
}
export { UrlNormalizer };
