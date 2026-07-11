const axios = require("axios");
const { URL } = require("url");
const cheerio = require("cheerio");
const { addDocument } = require("./indexStore");
const visited = new Set();
const queue = [];
const DELAY_MS = 1000;

async function crawl(startUrl, maxPages = 20) {
  queue.push(startUrl);
  while (queue.length !== 0 && visited.size < maxPages) {
    const currentUrl = queue.shift();
    const baseDomain = new URL(currentUrl).hostname;
    visited.add(currentUrl);
    let response;
    try {
      response = await axios.get(currentUrl, {
        timeout: 10000,
        headers: { "User-Agent": "MySearchBot/1.0" },
      });
    } catch (err) {
      visited.delete(currentUrl);
      continue;
    }
    const html = response.data;
    const $ = cheerio.load(html);
    const allText = $("body").text();
    addDocument(currentUrl, allText);
    getInternalLinks($, currentUrl, baseDomain).forEach((item) => {
      if (!visited.has(item) && !queue.includes(item)) {
        queue.push(item);
      }
    });
    await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
  }
}
function getInternalLinks($, currentUrl, baseDomain) {
  const internalLinks = [];
  const baseUrl = new URL(currentUrl);
  $("a").each((i, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    if (href.startsWith("#") || href.startsWith("mailto:")) return;
    const absoluteUrl = new URL(href, currentUrl);
    if (absoluteUrl.hostname === baseDomain) {
      internalLinks.push(absoluteUrl.href);
    }
  });
  return internalLinks;
}
