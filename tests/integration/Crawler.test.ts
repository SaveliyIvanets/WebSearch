import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { Crawler } from "../../src/crawler/Crawler.js";
import { PageFetcher } from "../../src/crawler/PageFetcher.js";
import { HtmlParser } from "../../src/crawler/HtmlParser.js";
import { LinkExtractor } from "../../src/crawler/LinkExtractor.js";
import { RobotsParser } from "../../src/crawler/RobotsParser.js";
import { IndexStore } from "../../src/indexer/IndexStore.js";
import { SearchEngine } from "../../src/search/SearchEngine.js";

const server = setupServer(
  http.get("https://testsite.com/robots.txt", () => {
    return HttpResponse.text("User-agent: *\nAllow: /");
  }),
  http.get("https://testsite.com/", () => {
    return HttpResponse.text(
      `
      <html>
        <body>
          <h1>Welcome Home</h1>
          <a href="/about">About Us</a>
        </body>
      </html>
    `,
      { headers: { "content-type": "text/html" } },
    );
  }),
  http.get("https://testsite.com/about", () => {
    return HttpResponse.text(
      `
      <html>
        <body>
          <h1>About Our Search Engine Project</h1>
        </body>
      </html>
    `,
      { headers: { "content-type": "text/html" } },
    );
  }),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("Crawler Integration", () => {
  it("should crawl site and populate search index", async () => {
    const pageFetcher = new PageFetcher({ timeout: 2000 });
    const htmlParser = new HtmlParser();
    const linkExtractor = new LinkExtractor();
    const robotsParser = new RobotsParser(pageFetcher);
    const indexStore = new IndexStore();

    const crawler = new Crawler({
      workerCount: 1,
      pageFetcher,
      htmlParser,
      linkExtractor,
      robotsParser,
      indexStore,
      maxPages: 5,
      maxDepth: 2,
    });

    await crawler.crawl("https://testsite.com/");

    const searchEngine = new SearchEngine(indexStore);
    const results = searchEngine.search("search engine project");

    expect(results).toContain("https://testsite.com/about");
  });
});
