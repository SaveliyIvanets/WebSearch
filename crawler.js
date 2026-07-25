const axios = require("axios");
const { URL } = require("url");
const cheerio = require("cheerio");
const { addDocument } = require("./indexStore");
class Crawler {
  constructor() {
    this.visited = new Set();
    this.queue = new Set();
    this.disallowedPaths = new Set();
  }
  _pushToQueue(url) {
    if (!this.visited.has(url) && !this._isDisallowed(url)) {
      this.queue.add(url);
    }
  }
  _popFromQueue() {
    const firstUrl = this.queue.values().next().value;
    if (firstUrl) {
      this.queue.delete(firstUrl);
    }
    return firstUrl;
  }
  async crawl(startUrl, maxPages = 20) {
    const DELAY_MS = 1000;
    const startUrlObj = new URL(startUrl);
    const baseDomain = startUrlObj.hostname;
    await this._loadRobotsTxt(startUrl);
    this._pushToQueue(startUrl);
    const WORKER_COUNT = 10;
    const workers = [];
    for (let i = 0; i < WORKER_COUNT; i++) {
      workers.push(this._worker(i, baseDomain, maxPages));
    }
    await Promise.all(workers);
  }
  _extractInternalLinks($, currentUrl, baseDomain) {
    const internalLinks = [];
    $("a").each((i, el) => {
      const href = $(el).attr("href");
      if (!href) return;
      if (
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("javascript:")
      )
        return;
      try {
        const absoluteUrl = new URL(href, currentUrl);
        absoluteUrl.hash = "";
        //absoluteUrl.search = "";
        if (absoluteUrl.hostname === baseDomain) {
          internalLinks.push(absoluteUrl.href);
        }
      } catch (err) {}
    });
    return internalLinks;
  }

  async _fetchHtml(url) {
    let response;
    try {
      response = await axios.get(url, {
        timeout: 10000,
        headers: { "User-Agent": "SearchBot/1.0" },
        responseType: "text",
      });

      if (!response.headers["content-type"]?.includes("text/html")) return null;
      return response.data;
    } catch (err) {
      return null;
    }
  }
  _extractPageData(html) {
    const $ = cheerio.load(html);
    $(
      "script, style, noscript, template, svg, nav, footer, header, aside, form",
    ).remove();
    const allText = $("body").text().replace(/\s+/g, " ").trim();
    return { $, allText };
  }
  async _worker(id, baseDomain, maxPages) {
    while (this.visited.size < maxPages) {
      if (this.queue.size === 0) {
        await new Promise((resolve) => setTimeout(resolve, this.DELAY_MS));
        if (this.queue.size === 0) {
          break;
        }
        continue;
      }
      const currentUrl = this._popFromQueue();
      if (this.visited.has(currentUrl)) continue;
      this.visited.add(currentUrl);
      console.log(
        `[Worker ${id}] Качаю (${this.visited.size}/${maxPages}): ${currentUrl}`,
      );
      const html = await this._fetchHtml(currentUrl);
      if (!html) {
        continue;
      }
      const { $, allText } = this._extractPageData(html);
      addDocument(currentUrl, allText);
      const foundLinks = this._extractInternalLinks($, currentUrl, baseDomain);
      for (const link of foundLinks) {
        this._pushToQueue(link);
      }
      await new Promise((resolve) => setTimeout(resolve, this.DELAY_MS));
    }
  }
  async _loadRobotsTxt(origin) {
    const robotsUrl = new URL("/robots.txt", origin);
    const html = await this._fetchHtml(robotsUrl.href);
    if (!html) return;
    const lines = html.split("\n");
    let forUs = false;
    for (const line of lines) {
      const [key, ...val] = line.trim().split(":");
      const trimmedKey = key.trim().toLowerCase();
      const trimmedValue = val.join(":").trim();
      if (trimmedKey === "user-agent") {
        if (trimmedValue === "*") {
          forUs = true;
        } else {
          forUs = false;
        }
        continue;
      }
      if (forUs) {
        this._addToDisallowedPaths(trimmedKey, trimmedValue);
      }
    }
  }
  _addToDisallowedPaths(key, value) {
    if (key === "disallow" && value.length > 0) {
      this.disallowedPaths.add(value);
    }
  }
  _isDisallowed(url) {
    try {
      const { pathname } = new URL(url);
      for (const disallowedPath of this.disallowedPaths) {
        if (pathname.startsWith(disallowedPath)) {
          return true;
        }
      }
    } catch (e) {
      return false;
    }
    return false;
  }
}
module.exports = { Crawler };
