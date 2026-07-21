const axios = require("axios");
const { URL } = require("url");
const cheerio = require("cheerio");
const { addDocument } = require("./indexStore");
const visited = new Set();
const queue = [];
const DELAY_MS = 1000;

async function crawl(startUrl, maxPages = 20) {
  queue.push(startUrl);
  const startUrlObj = new URL(startUrl);
  const baseDomain = startUrlObj.hostname;
  const WORKER_COUNT = 3;
  const workers = [];
  for (let i = 0; i < WORKER_COUNT; i++) {
    workers.push(_worker(i, baseDomain, maxPages));
  }
  await Promise.all(workers);
}
function _extractInternalLinks($, currentUrl, baseDomain) {
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
      if (absoluteUrl.hostname === baseDomain) {
        internalLinks.push(absoluteUrl.href);
      }
    } catch (err) {}
  });
  return internalLinks;
}

async function _fetchHtml(url) {
  let response;
  try {
    response = await axios.get(url, {
      timeout: 10000,
      headers: { "User-Agent": "SearchBot/1.0" },
    });
    return response.data;
  } catch (err) {
    return null;
  }
}
function _extractPageData(html) {
  const $ = cheerio.load(html);
  $(
    "script, style, noscript, template, svg, nav, footer, header, aside, form",
  ).remove();
  const allText = $("body").text();
  return { $, allText };
}
async function _worker(id, baseDomain, maxPages) {
  while (visited.size < maxPages) {
    if (queue.length === 0) {
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
      if (queue.length === 0) {
        break;
      }
      continue;
    }
    const currentUrl = queue.shift();
    if (visited.has(currentUrl)) continue;
    visited.add(currentUrl);
    console.log(
      `[Worker ${id}] Качаю (${visited.size}/${maxPages}): ${currentUrl}`,
    );
    const html = await _fetchHtml(currentUrl);
    if (!html) {
      visited.delete(currentUrl);
      continue;
    }
    const { $, allText } = _extractPageData(html);
    addDocument(currentUrl, allText);
    const foundLinks = _extractInternalLinks($, currentUrl, baseDomain);
    for (const link of foundLinks) {
      if (!visited.has(link) && !queue.includes(link)) {
        queue.push(link);
      }
    }
    await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
  }
}
module.exports = { crawl };
