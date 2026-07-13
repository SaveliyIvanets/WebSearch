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
  while (queue.length !== 0 && visited.size < maxPages) {
    const currentUrl = queue.shift();
    if (visited.has(currentUrl)) continue; // for future work when there will be several workers
    visited.add(currentUrl);
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
  const allText = $("body").text();
  return { $, allText };
}
module.exports = { crawl };
