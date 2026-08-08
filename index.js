import { RobotsParser } from './src/crawler/RobotsParser.js';
import { PageFetcher } from './src/crawler/PageFetcher.js';
import { HtmlParser } from './src/crawler/HtmlParser.js';
import { LinkExtractor } from './src/crawler/LinkExtractor.js';
import { IndexStore } from './src/indexer/IndexStore.js';

import { Crawler } from './src/crawler/Crawler.js';


const crawler = new Crawler({
    workerCount: 5,          // количество параллельных воркеров
    delayMs: 500,            // задержка между запросами (мс)
    maxPages: 50,            // максимум страниц для обхода

    pageFetcher: new PageFetcher(),
    htmlParser: HtmlParser,
    linkExtractor: LinkExtractor,
    robotsParser: new RobotsParser(new PageFetcher()),
    indexStore: new IndexStore()
});

// Запуск метода crawl с начальным URL
const startUrl = "https://metanit.com/"
console.log(`🚀 Запуск краулинга для ${startUrl}`);
await crawler.crawl(startUrl);
console.log('✅ Краулинг завершён');
crawler.indexStore.saveIndexToDisk('./data/index.json')