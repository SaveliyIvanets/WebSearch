// index.js
import { Crawler } from './src/crawler/Crawler.js';
import { RobotsParser } from './src/crawler/RobotsParser.js';
import { PageFetcher } from './src/crawler/PageFetcher.js';
import { LinkExtractor } from './src/crawler/LinkExtractor.js';
import { IndexStore } from './src/indexer/IndexStore.js';
import { HtmlParser } from './src/crawler/HtmlParser.js'; // импортируем класс

// Создаём зависимости
const pageFetcher = new PageFetcher({ timeout: 10000 });
const robotsParser = new RobotsParser(pageFetcher);
const indexStore = new IndexStore();

// ВАЖНО: передаём HtmlParser как класс, а не экземпляр
const crawler = new Crawler({
    workerCount: 5,
    delayMs: 500,
    maxPages: 50,
    pageFetcher,
    htmlParser: HtmlParser,   // ← передаём класс
    linkExtractor: LinkExtractor,
    robotsParser,
    indexStore,
});

const startUrl = "https://github.com/Dinarchak";
console.log(`🚀 Запуск краулинга для ${startUrl}`);
await crawler.crawl(startUrl);
console.log('✅ Краулинг завершён');