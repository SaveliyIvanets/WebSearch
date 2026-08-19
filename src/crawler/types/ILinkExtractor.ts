import { CheerioAPI } from "cheerio";

interface ILinkExtractor {
    extractInternalLinks(
        $: CheerioAPI,
        currentUrl: string,
        baseHostname: string,
      ): Set<string>
}

export { ILinkExtractor };