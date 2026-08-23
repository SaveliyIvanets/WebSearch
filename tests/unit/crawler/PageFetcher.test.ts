import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { PageFetcher } from "../../../src/crawler/PageFetcher.js";

const server = setupServer(
  http.get("https://site.com/valid", () => {
    return HttpResponse.text("<html>Hello</html>", {
      headers: { "Content-Type": "text/html" },
    });
  }),
  http.get("https://site.com/json", () => {
    return HttpResponse.json({ data: 123 });
  }),
  http.get("https://site.com/500", () => {
    return new HttpResponse(null, { status: 500 });
  }),
  http.get("https://site.com/slow", async () => {
    await new Promise((res) => setTimeout(res, 200));
    return HttpResponse.text("slow response");
  }),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("PageFetcher", () => {
  it("should fetch text from valid HTML/plain endpoint", async () => {
    const fetcher = new PageFetcher();
    const result = await fetcher.fetchText("https://site.com/valid");
    expect(result).toBe("<html>Hello</html>");
  });

  it("should return null for non-HTML/plain content type", async () => {
    const fetcher = new PageFetcher();
    const result = await fetcher.fetchText("https://site.com/json");
    expect(result).toBeNull();
  });

  it("should return null on HTTP error response", async () => {
    const fetcher = new PageFetcher();
    const result = await fetcher.fetchText("https://site.com/500");
    expect(result).toBeNull();
  });

  it("should abort and return null when request times out", async () => {
    const fetcher = new PageFetcher({ timeout: 50 });
    const result = await fetcher.fetchText("https://site.com/slow");
    expect(result).toBeNull();
  });
});
