import { Queue } from "./Queue.js";
import { Worker } from "./Worker.js";
import { CrawlTask } from "./types/CrawlTask.js";
import { State } from "./types/State.js";
import { HtmlParser } from "./HtmlParser.js";
import { LinkExtractor } from "./LinkExtractor.js";

import { IndexStore as IIndexStore } from "../indexer/types/IndexStore.js";
import { RobotsParser as IRobotsParser } from "./types/RobotsParser.js";
import { PageFetcher as IPageFetcher } from "./types/PageFetcher.js";
import { IHtmlParser } from "./types/IHtmlParser.js";
import { ILinkExtractor } from "./types/ILinkExtractor.js";

interface Options {
  workerCount?: number;
  
  pageFetcher: IPageFetcher;
  htmlParser: IHtmlParser;
  linkExtractor: ILinkExtractor;
  robotsParser: IRobotsParser;
  indexStore: IIndexStore;
  
  maxPages?: number;
  maxDepth?: number;
}

class Crawler {
  private readonly workerCount: number;

  private readonly queue: Queue<CrawlTask>;
  private readonly visited: Set<string>;
  private readonly state: State;

  private readonly pageFetcher: IPageFetcher;
  private readonly htmlParser: IHtmlParser;
  private readonly linkExtractor: ILinkExtractor;
  private readonly robotsParser: IRobotsParser;
  private readonly indexStore: IIndexStore;

  private readonly maxPages: number;
  private readonly maxDepth: number;

  constructor(options: Options) {
    this.workerCount = options.workerCount ?? 10;

    this.queue = new Queue<CrawlTask>();
    this.visited = new Set<string>();
    this.state = {
      activeWorkers: 0,
    };

    this.pageFetcher = options.pageFetcher;
    this.htmlParser = options.htmlParser;
    this.linkExtractor = options.linkExtractor;
    this.robotsParser = options.robotsParser;
    this.indexStore = options.indexStore;

    this.maxPages = options.maxPages ?? Infinity;
    this.maxDepth = options.maxDepth ?? Infinity;
  }

  async crawl(startUrl: string): Promise<void> {
    const startUrlObj = new URL(startUrl);
    const baseDomain = startUrlObj.hostname;

    await this.robotsParser.load(startUrl);

    this.queue.push({
      url: startUrl,
      depth: 0,
    });

    const workers: Promise<void>[] = [];

    for (let i = 0; i < this.workerCount; i++) {
      const worker = new Worker({
        queue: this.queue,
        visited: this.visited,
        state: this.state,
        robotsParser: this.robotsParser,
        pageFetcher: this.pageFetcher,
        htmlParser: this.htmlParser,
        linkExtractor: this.linkExtractor,
        maxPages: this.maxPages,
        maxDepth: this.maxDepth,
        indexStore: this.indexStore,
      });

      workers.push(worker.run(baseDomain));
    }

    await Promise.all(workers);
  }
}

export { Crawler };
