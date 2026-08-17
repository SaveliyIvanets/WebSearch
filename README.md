# Mini Search Engine

A small TypeScript search engine: it crawls a website (crawler), builds an inverted index (indexer), and runs queries against it (search).

## Architecture

The project has three modules:

```
crawler/   — crawls a site and collects page text content
indexer/   — builds and stores the inverted index
search/    — searches documents against the index
```

### 1. Crawler

Handles crawling a site from a given start URL, respecting `robots.txt`, depth/page limits, and concurrency via workers.

| File | Purpose |
|---|---|
| `Crawler.ts` | Entry point. Creates the queue, spins up a worker pool (`workerCount`, default 10), waits for them to finish. |
| `Worker.ts` | A single worker: pulls a task from the queue, fetches the page, parses the HTML, adds the document to the index, extracts internal links, and pushes them back onto the queue. Respects the `crawl-delay` from `robots.txt`. |
| `Queue.ts` | Simple FIFO queue backed by a linked list (`push` / `pop` / `isEmpty` / `size`). |
| `PageFetcher.ts` | Fetches a page via `fetch` with a timeout and a custom `User-Agent`. Returns text only for `text/html` and `text/plain`, otherwise `null`. |
| `HtmlParser.ts` | Parses HTML with `cheerio`, strips boilerplate tags (`script`, `style`, `nav`, `footer`, `header`, `aside`, `form`, etc.), returns the `$` object and cleaned `<body>` text. |
| `LinkExtractor.ts` | Extracts only internal links from `$` (matching the base domain's hostname), skipping `mailto:`, `javascript:`, `tel:`, `data:`, etc. |
| `UrlNormalizer.ts` | Normalizes URLs: strips the hash, default ports (80/443), trailing slash, and lowercases the hostname. |
| `RobotsParser.ts` | Loads and parses `robots.txt`: `Allow`/`Disallow` rules (accounting for match length and `*`/`$` wildcards), `Crawl-delay`, `Sitemap`. `canVisit(url)` checks whether a path is allowed. |
| `types/*` | Interfaces (`CrawlTask`, `Queue<T>`, `PageFetcher`, `RobotsParser`, `State`) for loose coupling between modules. |

### 2. Indexer

Builds an inverted index mapping "token → set of document IDs".

| File | Purpose |
|---|---|
| `IndexStore.ts` | Keeps the index in memory (`Record<string, Set<string>>`), and can save/load it to/from disk as JSON. |
| `Tokenizer.ts` | Tokenizes text: lowercases it, splits on non-alphanumeric characters (unicode-aware), removes stop words, returns unique tokens. |
| `types/IndexStore.ts` | The `IndexStore` interface (`addDocument`, `getDocuments`). |

### 3. Search

| File | Purpose |
|---|---|
| `SearchEngine.ts` | Tokenizes the search query, retrieves posting lists for each token, sorts them by size (for speed), and intersects the sets, returning the IDs of documents containing every query token. |

## How it fits together

1. `Crawler.crawl(startUrl)` seeds the queue with one task and starts the workers.
2. Each `Worker` pulls a URL from the queue → downloads it (`PageFetcher`) → parses it (`HtmlParser`) → stores the text in the index (`IndexStore.addDocument`) → extracts links (`LinkExtractor`) → filters them via `RobotsParser.canVisit` and the depth limit → pushes new URLs onto the queue.
3. After crawling, the index can be persisted to disk (`IndexStore.saveIndexToDisk`).
4. `SearchEngine` uses the `IndexStore` (in memory or loaded from disk) to answer search queries.

## Usage example

```ts
import { Crawler } from "./crawler/Crawler.js";
import { PageFetcher } from "./crawler/PageFetcher.js";
import { HtmlParser } from "./crawler/HtmlParser.js";
import { LinkExtractor } from "./crawler/LinkExtractor.js";
import { RobotsParser } from "./crawler/RobotsParser.js";
import { IndexStore } from "./indexer/IndexStore.js";
import { SearchEngine } from "./search/SearchEngine.js";

const pageFetcher = new PageFetcher({ userAgent: "MyBot/1.0" });
const indexStore = new IndexStore();
const robotsParser = new RobotsParser(pageFetcher);

const crawler = new Crawler({
  pageFetcher,
  htmlParser: HtmlParser,
  linkExtractor: LinkExtractor,
  robotsParser,
  indexStore,
  workerCount: 5,
  maxPages: 200,
  maxDepth: 3,
});

await crawler.crawl("https://example.com");
indexStore.saveIndexToDisk("./index.json");

const searchEngine = new SearchEngine(indexStore);
const results = searchEngine.search("example query");
console.log(results); // list of URLs containing every query word
```

## Implementation notes

- **`robots.txt` compliance**: loaded before crawling starts, honors both `User-agent: *` and exact agent matches, applies the longest matching rule (ties go to `Allow`).
- **Polite crawling**: waits `Crawl-delay` (or 1 second by default) between requests.
- **Internal links only**: the crawler never leaves the starting domain.
- **Deduplication**: visited URLs are tracked in a `Set` and never processed twice.
- **Limits**: `maxPages` and `maxDepth` let you cap the crawl by page count or nesting depth.
