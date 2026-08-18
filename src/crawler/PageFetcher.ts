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

class PageFetcher {
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
    if (retryAfter) {
      const seconds = Number.parseInt(retryAfter, 10);
      if (!Number.isNaN(seconds)) {
        delay = seconds * 1000;
      } else {
        const date = Date.parse(retryAfter);
        if (!Number.isNaN(date)) {
          delay = date - Date.now();
        }
      }
    }
    return Math.max(MIN_RETRY_DELAY, Math.min(delay, maxRetryAfter));
  }

  async fetchText(url: string): Promise<string | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeout);
    try {
      let currentUrl = url;
      for (let i = 0; i <= this.maxRedirects; i++) {
        const response = await this.fetchOnce(currentUrl, controller.signal);
        if (REDIRECT_STATUSES.has(response.status)) {
          const location = response.headers.get("location");
          if (!location) {
            return null;
          }
          currentUrl = new URL(location, currentUrl).href;
          continue;
        }
        if (RETRY_STATUSES.has(response.status)) {
          for (let attempt = 0; attempt < this.maxRetries; attempt++) {
            await new Promise((resolve) =>
              setTimeout(resolve, PageFetcher.getRetryDelay(response, this.maxRetryAfter)),
            );
            const retryResponse = await this.fetchOnce(currentUrl, controller.signal);
            if (RETRY_STATUSES.has(retryResponse.status)) {
              continue;
            }
            return this.extractText(retryResponse);
          }
          return null;
        }
        return this.extractText(response);
      }
      return null;
    } catch (err) {
      return null;
    } finally {
      clearTimeout(timeout);
    }
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
