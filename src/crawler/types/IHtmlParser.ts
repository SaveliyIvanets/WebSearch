import { CheerioAPI } from "cheerio";

interface IHtmlParser {
    parse(html: string): { $: CheerioAPI; text: string };
}

export { IHtmlParser }