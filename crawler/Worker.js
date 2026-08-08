class Worker {
  constructor(options = {}) {
    this.queue = options.queue;
    this.visited = options.visited;
    this.state = options.state;
    this.robotsParser = options.robotsParser;
    this.pageFetcher = options.pageFetcher;
    this.htmlParser = options.htmlParser;
    this.linkExtractor = options.linkExtractor;
    this.maxPages = options.maxPages ?? Infinity;
    this.indexStore = options.indexStore;
    //this.maxDepth = options.maxDepth ?? Infinity; later
  }
  async run(id, baseDomain) {
    while (true) {
      if (this.visited.size >= this.maxPages) {
        break;
      }
      if (this.queue.isEmpty()) {
        if (this.state.activeWorkers === 0) {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, this.robotsParser.getCrawlDelay() ?? 1000));
        continue;
      }
      const currentUrl = this.queue.pop();
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
        if (!this.visited.has(link) && this.robotsParser.canVisit(link)) {
          this.queue.push(link);
        }
      }
      await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }
  }
}
export { Worker };
