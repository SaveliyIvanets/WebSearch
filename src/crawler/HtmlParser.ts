import * as cheerio from "cheerio";
import { CheerioAPI } from "cheerio";

class HtmlParser {
  private static readonly REMOVED_TAGS =
    "script, style, noscript, template, svg, nav, footer, header, aside, form";

  static parse(html: string): { $: CheerioAPI; text: string } {
    const $ = cheerio.load(html);
    $(HtmlParser.REMOVED_TAGS).remove();
    const text = $("body").text().replace(/\s+/g, " ").trim();
    return { $, text };
  }
}
export { HtmlParser };
