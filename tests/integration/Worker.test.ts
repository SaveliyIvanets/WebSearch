import { describe, it, expect, vi } from "vitest";
import { Worker } from "../../src/crawler/Worker.js";
import { Queue } from "../../src/crawler/Queue.js";
import { CrawlTask } from "../../src/crawler/types/CrawlTask.js";
import { State } from "../../src/crawler/types/State.js";
import { IPageFetcher } from "../../src/crawler/types/IPageFetcher.js";
import { IHtmlParser } from "../../src/crawler/types/IHtmlParser.js";
import { ILinkExtractor } from "../../src/crawler/types/ILinkExtractor.js";
import { IRobotsParser } from "../../src/crawler/types/IRobotsParser.js";
import { IIndexStore } from "../../src/indexer/types/IIndexStore.js";
import { CheerioAPI } from "cheerio";

describe("Worker", () => {
  it("should process tasks, index pages, and push discovered internal links with incremented depth", async () => {
    const queue = new Queue<CrawlTask>();
    queue.push({ url: "https://site.com/page1", depth: 0 });

    const visited = new Set<string>();
    const state: State = { activeWorkers: 0 };

    const pushSpy = vi.spyOn(queue, "push");

    const mockFetcher: IPageFetcher = {
      fetchText: vi.fn().mockResolvedValue("<html>Content</html>"),
    };

    const mockParser: IHtmlParser = {
      parse: vi
        .fn()
        .mockReturnValue({ $: {} as CheerioAPI, text: "parsed content" }),
    };

    const mockExtractor: ILinkExtractor = {
      extractInternalLinks: vi
        .fn()
        .mockReturnValue(new Set(["https://site.com/page2"])),
    };

    const mockRobots: IRobotsParser = {
      load: vi.fn(),
      getCrawlDelay: vi.fn().mockReturnValue(0),
      canVisit: vi.fn().mockReturnValue(true),
    };

    const mockIndexStore: IIndexStore = {
      addDocument: vi.fn(),
      getDocuments: vi.fn(),
    };

    const worker = new Worker({
      queue,
      visited,
      state,
      pageFetcher: mockFetcher,
      htmlParser: mockParser,
      linkExtractor: mockExtractor,
      robotsParser: mockRobots,
      indexStore: mockIndexStore,
      maxPages: 2,
      maxDepth: 1,
    });

    await worker.run("site.com");

    expect(mockIndexStore.addDocument).toHaveBeenCalledWith(
      "https://site.com/page1",
      "parsed content",
    );

    expect(pushSpy).toHaveBeenCalledWith({
      url: "https://site.com/page2",
      depth: 1,
    });

    expect(visited.has("https://site.com/page1")).toBe(true);
    expect(visited.has("https://site.com/page2")).toBe(true);

    expect(queue.isEmpty()).toBe(true);
  });
});
