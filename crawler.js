const axios = require("axios");
const { URL } = require("url");
const cheerio = require("cheerio");
const { addDocument } = require("./indexStore");
const visited = new Set();
const queue = new Set();
const DELAY_MS = 1000;
const disallowedPaths = new Set();
function _pushToQueue(url) {
  if (!visited.has(url) && !_isDisallowed(url)) {
    queue.add(url);
  }
}
function _popFromQueue() {
  const firstUrl = queue.values().next().value;
  if (firstUrl) {
    queue.delete(firstUrl);
  }
  return firstUrl;
}
async function crawl(startUrl, maxPages = 20) {
  const startUrlObj = new URL(startUrl);
  const baseDomain = startUrlObj.hostname;
  await _loadRobotsTxt(startUrl, baseDomain);
  _pushToQueue(startUrl);
  const WORKER_COUNT = 10;
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
      absoluteUrl.hash = "";
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
    if (queue.size === 0) {
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
      if (queue.size === 0) {
        break;
      }
      continue;
    }
    const currentUrl = _popFromQueue();
    if (visited.has(currentUrl)) continue;
    visited.add(currentUrl);
    console.log(
      `[Worker ${id}] Качаю (${visited.size}/${maxPages}): ${currentUrl}`,
    );
    const html = await _fetchHtml(currentUrl);
    if (!html) {
      continue;
    }
    const { $, allText } = _extractPageData(html);
    addDocument(currentUrl, allText);
    const foundLinks = _extractInternalLinks($, currentUrl, baseDomain);
    for (const link of foundLinks) {
      _pushToQueue(link);
    }
    await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
  }
}
async function _loadRobotsTxt(origin) {
  const robotsUrl = new URL("/robots.txt", origin);
  const html = await _fetchHtml(robotsUrl.href);
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
      _addToDisallowedPaths(trimmedKey, trimmedValue);
    }
  }
}
function _addToDisallowedPaths(key, value) {
  if (key === "disallow" && value.length > 0) {
    disallowedPaths.add(value);
  }
}
function _isDisallowed(url) {
  try {
    const { pathname } = new URL(url);
    for (const disallowedPath of disallowedPaths) {
      if (pathname.startsWith(disallowedPath)) {
        return true;
      }
    }
  } catch (e) {
    return false;
  }
  return false;
}
module.exports = { crawl };
