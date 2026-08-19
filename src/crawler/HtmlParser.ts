import * as cheerio from "cheerio";
import { CheerioAPI } from "cheerio";
import { IHtmlParser } from "./types/IHtmlParser.js"
import { Logger } from "../logger/Logger.js";

const logger = new Logger({ prefix: "HtmlParser" });

class HtmlParser implements IHtmlParser {
  private static readonly REMOVED_TAGS =
    "script, style, noscript, template, svg, nav, footer, header, aside, form";

  parse(html: string): { $: CheerioAPI; text: string } {
    const $ = cheerio.load(html);
    $(HtmlParser.REMOVED_TAGS).remove();
    const text = $("body").text().replace(/\s+/g, " ").trim();
    logger.debug("HTML parsed", { htmlLength: html.length, textLength: text.length });
    return { $, text };
  }
}
export { HtmlParser };
