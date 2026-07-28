const { PageFetcher } = require("./PageFetcher");
class RobotsParser {
  constructor(pageFetcher) {
    this.disallowedPaths = new Set();
    this.pageFetcher = pageFetcher;
  }
  async load(origin) {
    const robotsUrl = new URL("/robots.txt", origin);
    const html = await this.pageFetcher.fetchText(robotsUrl.href);
    this._parseRobotsTxt(html);
  }
  _addToDisallowedPaths(key, value) {
    if (key === "disallow" && value.length > 0) {
      this.disallowedPaths.add(value);
    }
  }
  canVisit(url) {
    try {
      const { pathname } = new URL(url);
      for (const disallowedPath of this.disallowedPaths) {
        if (pathname.startsWith(disallowedPath)) {
          return false;
        }
      }
    } catch (e) {
      return true;
    }
    return true;
  }
  _parseRobotsTxt(html) {
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
}
module.exports = { RobotsParser };
