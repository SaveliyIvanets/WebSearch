import { Worker } from "./Worker.js";
import { Queue } from "./Queue.js";
class Crawler {
  constructor(options = {}) {
    this.workerCount = options.workerCount ?? 10;

    this.queue = new Queue();
    this.visited = new Set();
    this.state = { activeWorkers: 0 };

    this.pageFetcher = options.pageFetcher;
    this.htmlParser = options.htmlParser;
    this.linkExtractor = options.linkExtractor;
    this.robotsParser = options.robotsParser;
    this.indexStore = options.indexStore;

    this.maxPages = options.maxPages ?? Infinity;
    //this.maxDepth = options.maxDepth ?? Infinity; later
  }
  async crawl(startUrl) {
    const startUrlObj = new URL(startUrl);
    const baseHostname = startUrlObj.hostname;
    await this.robotsParser.load(startUrl);
    this.queue.push(startUrl);
    const workers = [];
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
        indexStore: this.indexStore,
      });

      workers.push(worker.run(i, baseHostname));
    }
    await Promise.all(workers);
  }
}
export { Crawler };
