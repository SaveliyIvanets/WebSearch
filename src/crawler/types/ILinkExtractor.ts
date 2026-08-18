import { CheerioAPI } from "cheerio";

interface ILinkExtractor {
    extractInternalLinks(
        $: CheerioAPI,
        currentUrl: string,
        baseHostname: string,
      ): Set<string>

    _isValidLink(href: string | null | undefined): href is string
}

export { ILinkExtractor }