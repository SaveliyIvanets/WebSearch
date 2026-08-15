interface Option {
  timeout?: number;
  userAgent?: string;
}
class PageFetcher {
  private readonly timeout: number;
  public readonly userAgent: string;
  constructor(options: Option = {}) {
    this.timeout = options.timeout ?? 10000;
    this.userAgent = options.userAgent ?? "SearchBot/1.0";
  }
  async fetchText(url: string): Promise<string | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeout);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: "text/html, text/plain",
          "User-Agent": this.userAgent,
        },
      });
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
    } catch (err) {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export { PageFetcher };
