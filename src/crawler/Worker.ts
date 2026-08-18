import { Queue } from "./types/Queue.js";
import { CrawlTask } from "./types/CrawlTask.js";
import { State } from "./types/State.js";
import { PageFetcher as IPageFetcher } from "./types/PageFetcher.js";
import { HtmlParser } from "./HtmlParser.js";
import { LinkExtractor } from "./LinkExtractor.js";
import { IndexStore as IIndexStore } from "../indexer/types/IndexStore.js";
import { RobotsParser as IRobotsParser } from "./types/RobotsParser.js";
import { IHtmlParser } from "./types/IHtmlParser.js";
import { ILinkExtractor } from "./types/ILinkExtractor.js";

interface Option {
  queue: Queue<CrawlTask>;
  visited: Set<string>;
  state: State;
  pageFetcher: IPageFetcher;
  htmlParser: IHtmlParser; 
  linkExtractor: ILinkExtractor; 
  robotsParser: IRobotsParser; 
  maxPages?: number;
  maxDepth?: number;
  indexStore: IIndexStore;
}
class Worker {
  private readonly queue;
  private readonly visited;
  private readonly state;
  private readonly robotsParser;
  private readonly pageFetcher: IPageFetcher;
  private readonly htmlParser: IHtmlParser; 
  private readonly linkExtractor: ILinkExtractor;
  private readonly maxPages;
  private readonly maxDepth;
  private readonly indexStore;

  constructor(options: Option) {
    this.queue = options.queue;
    this.visited = options.visited;
    this.state = options.state;
    this.robotsParser = options.robotsParser;
    this.pageFetcher = options.pageFetcher;
    this.htmlParser = options.htmlParser;
    this.linkExtractor = options.linkExtractor;
    this.maxPages = options.maxPages ?? Infinity;
    this.maxDepth = options.maxDepth ?? Infinity;
    this.indexStore = options.indexStore;
  }
  async run(baseDomain: string):  Promise<void> {
    while (true) {
      if (this.visited.size >= this.maxPages) {
        break;
      }
      if (this.queue.isEmpty()) {
        if (this.state.activeWorkers === 0) {
          break;
        }
        await new Promise((resolve) =>
          setTimeout(resolve, this.robotsParser.getCrawlDelay() ?? 1000),
        );
        continue;
      }

      const task = this.queue.pop();
      if (task === null) continue;

      const { url: currentUrl, depth: currentDepth } = task;
      if (this.visited.has(currentUrl)) continue;
      this.visited.add(currentUrl);
      this.state.activeWorkers++;
      const html = await this.pageFetcher.fetchText(currentUrl);
      this.state.activeWorkers--;
      if (!html) {
        continue;
      }
      const { $, text } = this.htmlParser.parse(html);
      this.indexStore.addDocument(currentUrl, text);
      const foundLinks = this.linkExtractor.extractInternalLinks(
        $,
        currentUrl,
        baseDomain,
      );
      for (const link of foundLinks) {
        if (
          !this.visited.has(link) &&
          this.robotsParser.canVisit(link) &&
          currentDepth + 1 <= this.maxDepth
        ) {
          this.queue.push({ url: link, depth: currentDepth + 1 });
        }
      }
      await new Promise((resolve) => setTimeout(resolve,  this.robotsParser.getCrawlDelay() ?? 1000));
    }
  }
}
export { Worker };
