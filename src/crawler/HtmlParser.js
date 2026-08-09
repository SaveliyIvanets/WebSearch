import * as cheerio from "cheerio";
class HtmlParser {
  static parse(html) {
    const REMOVED_TAGS =
      "script, style, noscript, template, svg, nav, footer, header, aside, form";
    const $ = cheerio.load(html);
    $(REMOVED_TAGS).remove();
    const text = $("body").text().replace(/\s+/g, " ").trim();
    return { $, text };
  }
}
export { HtmlParser };
