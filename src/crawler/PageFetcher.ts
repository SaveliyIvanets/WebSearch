import { IPageFetcher } from "./types/IPageFetcher.js";
import { Logger } from "../logger/Logger.js";

const logger = new Logger({ prefix: "PageFetcher" });

interface Option {
  timeout?: number;
  userAgent?: string;
  maxRedirects?: number;
  maxRetries?: number;
  maxRetryAfter?: number;
}

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const RETRY_STATUSES = new Set([429, 503]);
const DEFAULT_RETRY_DELAY = 2000;
const MIN_RETRY_DELAY = 1000;

class PageFetcher implements IPageFetcher{
  private readonly timeout: number;
  private readonly maxRedirects: number;
  private readonly maxRetries: number;
  private readonly maxRetryAfter: number;
  public readonly userAgent: string;
  constructor(options: Option = {}) {
    this.timeout = options.timeout ?? 10000;
    this.maxRedirects = options.maxRedirects ?? 5;
    this.maxRetries = options.maxRetries ?? 2;
    this.maxRetryAfter = options.maxRetryAfter ?? 30000;
    this.userAgent = options.userAgent ?? "SearchBot/1.0";
  }

  private async fetchOnce(url: string, signal: AbortSignal): Promise<Response> {
    return fetch(url, {
      signal,
      redirect: "manual",
      headers: {
        Accept: "text/html, text/plain",
        "User-Agent": this.userAgent,
      },
    });
  }

  private static getRetryDelay(response: Response, maxRetryAfter: number): number {
    const retryAfter = response.headers.get("retry-after");
    let delay = DEFAULT_RETRY_DELAY;

    if (!retryAfter) {
      return Math.max(MIN_RETRY_DELAY, Math.min(DEFAULT_RETRY_DELAY, maxRetryAfter));
    }

    const seconds = Number.parseInt(retryAfter, 10);
    if (!Number.isNaN(seconds)) {
      delay = seconds * 1000;
    } else {
      const date = Date.parse(retryAfter);
      if (!Number.isNaN(date)) {
        delay = date - Date.now();
      }
    }

    return Math.max(MIN_RETRY_DELAY, Math.min(delay, maxRetryAfter));
  }

  async fetchText(url: string): Promise<string | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeout);
    logger.debug("Fetching page", { url, timeout: this.timeout });
    try {
      return await this.fetchWithLimits(
        url,
        this.maxRedirects,
        this.maxRetries,
        controller.signal,
      );
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async fetchWithLimits(
    url: string,
    redirectsLeft: number,
    retriesLeft: number,
    signal: AbortSignal,
  ): Promise<string | null> {
    if (redirectsLeft < 0 || retriesLeft < 0) {
      return null;
    }

    const response = await this.fetchOnce(url, signal);

    if (REDIRECT_STATUSES.has(response.status)) {
      if (redirectsLeft === 0 || !response.headers.get("location")) {
        return null;
      }
      const nextUrl = new URL(response.headers.get("location")!, url).href;
      return this.fetchWithLimits(nextUrl, redirectsLeft - 1, this.maxRetries, signal);
    }

    if (RETRY_STATUSES.has(response.status)) {
      if (retriesLeft === 0) {
        return null;
      }
      await new Promise((resolve) =>
        setTimeout(resolve, PageFetcher.getRetryDelay(response, this.maxRetryAfter)),
      );
      return this.fetchWithLimits(url, redirectsLeft, retriesLeft - 1, signal);
    }

    return this.extractText(response);
  }

  private async extractText(response: Response): Promise<string | null> {
    if (!response.ok) {
      return null;
    }
    const contentType =
      response.headers.get("content-type")?.toLowerCase() || "";
    if (
      contentType.includes("text/html") ||
      contentType.includes("text/plain")
    ) {
      return await response.text();
    }
    return null;
  }
}

export { PageFetcher };
