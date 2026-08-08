class RobotsParser {
  constructor(pageFetcher) {
    this.pageFetcher = pageFetcher;

    this.rules = {
      allowedPaths: [],
      disallowedPaths: [],
      crawlDelay: null,
      sitemap: null
    };
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

  getCrawlDelay() {
    return this.rules.crawlDelay !== null ? this.rules.crawlDelay * 1000 : null;
  }

  canVisit(url) {
    try {
        const urlObj = new URL(url);
        const pathWithQuery = urlObj.pathname + urlObj.search;

        let bestMatch = null;
        let bestType = null; // 'allow' или 'disallow'

        const isPatternMatch = (pattern, path) => {
            const escapedPattern = pattern
                .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                .replace(/\\\*/g, '.*')  // * → .*
                .replace(/\\\$/g, '$');  // $ → конец строки
            const regex = new RegExp(`^${escapedPattern}`);
            return regex.test(path);
        };

        // Функция для вычисления "эффективной длины" паттерна (игнорируем * и $)
        const getEffectiveLength = (pattern) => {
            // Убираем * и $ из подсчёта, т.к. они не делают паттерн более конкретным
            return pattern.replace(/[\*\$]/g, '').length;
        };

        const allRules = [
            ...this.rules.allowedPaths.map(p => ({ path: p, type: 'allow' })),
            ...this.rules.disallowedPaths.map(p => ({ path: p, type: 'disallow' }))
        ];

        for (const rule of allRules) {
            if (isPatternMatch(rule.path, pathWithQuery)) {
                const currentLength = getEffectiveLength(rule.path);
                if (bestMatch === null || currentLength > getEffectiveLength(bestMatch)) {
                    bestMatch = rule.path;
                    bestType = rule.type;
                } else if (currentLength === getEffectiveLength(bestMatch) && rule.type === 'allow') {
                    // При равной длине приоритет у Allow
                    bestType = 'allow';
                }
            }
        }

        // Если нет совпадений или лучшее совпадение — Allow, возвращаем true
        return bestType !== 'disallow';
    } catch {
        // При ошибке парсинга URL — разрешаем
        return true;
    }
}

  _parseRobotsTxt(html) {
    if (!html) return;
    const lines = html.split("\n");
    let isOurAgent = false;
    let rulesForOurAgent = [];
    for (const line of lines) {
      const trimmed = line.trim();

      // скип комментариев и пустых строк
      if (!trimmed || trimmed.startsWith('#')) continue;

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
        const myAgent = this.pageFetcher.userAgent?.toLowerCase() || '';
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

  _applyRules(rules) {
    for (const rule of rules) {
        switch (rule.key) {
            case 'allow':
                if (rule.value) {
                    this.rules.allowedPaths.push(rule.value);
                }
                break;
            case 'disallow':
                if (rule.value) {
                    this.rules.disallowedPaths.push(rule.value);
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
