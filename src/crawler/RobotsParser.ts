import { PageFetcher } from "./PageFetcher.js";
import { IRobotsParser } from "./types/IRobotsParser.js";
import { Logger } from "../logger/Logger.js";

const logger = new Logger({ prefix: "RobotsParser" });

type PatternType = "allow" | "disallow";

interface RobotsRule {
    key: string;
    value: string;
}

interface RobotsRules {
    allowedPaths: UrlPattern[];
    disallowedPaths: UrlPattern[];
    crawlDelay: number | null;
    sitemap: string | null;
}

class UrlPattern {
    readonly pattern: string;
    readonly effectiveLength: number;
    readonly type: PatternType;
    private readonly regex: RegExp;

    constructor(pattern: string, type: PatternType) {
        this.pattern = pattern;
        this.effectiveLength = pattern.replace(/[\*\$]/g, '').length;
        this.type = type

        const clearPattern = pattern
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\\\*/g, '.*')  // * → .*
        .replace(/\\\$/g, '$');  // $ → конец строки
        this.regex = new RegExp(`^${clearPattern}`);
    }

    isPatternMatch(path: string) : boolean {
    return this.regex.test(path);
    }
}

class RobotsParser implements IRobotsParser {
    private readonly pageFetcher: PageFetcher;
    private rules: RobotsRules;

    constructor(pageFetcher: PageFetcher) {
    this.pageFetcher = pageFetcher;

    this.rules = {
      allowedPaths: [],
      disallowedPaths: [],
      crawlDelay: null,
      sitemap: null
    };
  }

  async load(origin: string): Promise<void> {
    const robotsUrl = new URL("/robots.txt", origin);
    logger.info("Loading robots.txt", { url: robotsUrl.href });
    const html = await this.pageFetcher.fetchText(robotsUrl.href);
    if (!html) {
      logger.warn("robots.txt not found or empty", { origin });
      return;
    }
    this._parseRobotsTxt(html);
    logger.debug("Robots rules loaded", {
      allowed: this.rules.allowedPaths.length,
      disallowed: this.rules.disallowedPaths.length,
      crawlDelay: this.rules.crawlDelay,
      sitemap: this.rules.sitemap,
    });
  }

  getCrawlDelay() : number | null {
    return this.rules.crawlDelay !== null ? this.rules.crawlDelay * 1000 : null;
  }

  canVisit(url: string) : boolean{
        try {
            const urlObj = new URL(url);
            const pathWithQuery = urlObj.pathname + urlObj.search;
            let bestMatch: UrlPattern | null = null;

            const allRules = [
                ...this.rules.allowedPaths,
                ...this.rules.disallowedPaths
            ];

            for (const rule of allRules) {
                if (rule.isPatternMatch(pathWithQuery)) {
                    let isNewBestMatch =
                        bestMatch === null ||
                        rule.effectiveLength > bestMatch.effectiveLength ||
                        (rule.effectiveLength === bestMatch.effectiveLength && rule.type === 'allow');

                    if (isNewBestMatch) bestMatch = rule;
                }
            }
            const isAllowed = bestMatch === null || bestMatch.type === "allow";
            if (!isAllowed) {
                logger.debug("URL blocked by robots.txt", { url });
            }
            return isAllowed;
        } catch {
            return true;
        }
    }

  _parseRobotsTxt(html: string | null) : void {
    if (!html) return;
    const lines = html.split("\n");
    let isOurAgent = false;
    let rulesForOurAgent: RobotsRule[] = [];

    for (const line of lines) {
      let trimmed = line.trim();

      const hashIndex = trimmed.indexOf('#');
      if (hashIndex !== -1) {
        trimmed = trimmed.substring(0, hashIndex).trim();
      }

      if (!trimmed) continue;

      const [key, ...val] = trimmed.split(":");
      const keyLower = key.toLowerCase();
      const value = val.join(':').trim();
      if (keyLower === "user-agent") {
        //понять, вышли ли мы из нашей секции
        if (isOurAgent && rulesForOurAgent.length > 0) {
          this._applyRules(rulesForOurAgent);
          return;
        }
        //нашли ли нашу секцию
        const agent = value.toLowerCase();
        const myAgent = this.pageFetcher.userAgent.toLowerCase();
        isOurAgent = (agent === myAgent || agent === '*');
        rulesForOurAgent = [];
        continue;
      }

      if (!isOurAgent) continue;

      rulesForOurAgent.push({key: keyLower, value})

    }

    if (isOurAgent && rulesForOurAgent.length > 0) {
      this._applyRules(rulesForOurAgent);
    }
  }

  _applyRules(rules: RobotsRule[]) : void{
    for (const rule of rules) {
        switch (rule.key) {
            case 'allow':
                if (rule.value) {
                    this.rules.allowedPaths.push(new UrlPattern(rule.value, "allow"));
                }
                break;
            case 'disallow':
                if (rule.value) {
                    this.rules.disallowedPaths.push(new UrlPattern(rule.value, "disallow"));
                }
                break;
            case 'crawl-delay':
                const delay = parseInt(rule.value, 10);
                if (!isNaN(delay)) {
                    this.rules.crawlDelay = delay;
                }
                break;
            case 'sitemap':
                if (rule.value && !this.rules.sitemap) {
                    this.rules.sitemap = rule.value;
                }
                break;
            default:
                // Игнорируем другие правила
                break;
        }
    }
  }
}

export { RobotsParser };