const axios = require("axios");
class PageFetcher {
  constructor(options = {}) {
    this.timeout = options.timeout ?? 10000;
    this.userAgent = options.userAgent ?? "SearchBot/1.0";
  }
  async fetchText(url) {
    try {
      const response = await axios.get(url, {
        timeout: this.timeout,
        responseType: "text",
        headers: {
          Accept: "text/html, text/plain",
          "User-Agent": this.userAgent,
        },
      });
      const contentType = response.headers["content-type"]?.toLowerCase() || "";
      if (
        contentType.includes("text/html") ||
        contentType.includes("text/plain")
      ) {
        return response.data;
      }
      return null;
    } catch (err) {
      return null;
    }
  }
}

module.exports = { PageFetcher };
