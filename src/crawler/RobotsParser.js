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
    console.log(this.rules)
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
        const { pathname } = new URL(url);
        let bestMatch = null;
        let bestType = null; // 'allow' или 'disallow'

        // 1. Функция для проверки, соответствует ли паттерн пути
        const isPatternMatch = (pattern, path) => {
            // Экранируем спецсимволы для RegExp, кроме * и $
            // Заменяем * на .*, а $ на $ (конец строки)
            const escapedPattern = pattern
                .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Экранируем все спецсимволы
                .replace(/\\\*/g, '.*') // Заменяем экранированный \* на .*
                .replace(/\\\$/g, '$'); // Заменяем экранированный \$ на $
            const regex = new RegExp(`^${escapedPattern}`);
            return regex.test(path);
        };

        // 2. Функция для вычисления "эффективной длины" паттерна (игнорируем * и $)
        const getEffectiveLength = (pattern) => {
            // Убираем * и $ из подсчета длины
            return pattern.replace(/[\*\$]/g, '').length;
        };

        // 3. Проверяем все правила
        const allRules = [
            ...this.rules.allowedPaths.map(p => ({ path: p, type: 'allow' })),
            ...this.rules.disallowedPaths.map(p => ({ path: p, type: 'disallow' }))
        ];

        for (const rule of allRules) {
            if (isPatternMatch(rule.path, pathname)) {
                const currentLength = getEffectiveLength(rule.path);
                // Выбираем самый длинный паттерн
                if (bestMatch === null || currentLength > getEffectiveLength(bestMatch)) {
                    bestMatch = rule.path;
                    bestType = rule.type;
                } 
                // Если длины равны, приоритет у Allow
                else if (currentLength === getEffectiveLength(bestMatch) && rule.type === 'allow') {
                    bestType = 'allow';
                }
            }
        }

        // 4. Возвращаем результат
        // Если нет совпадений или лучшее совпадение - Allow, возвращаем true
        console.log(bestMatch, bestType, pathname)
        return bestType !== 'disallow';
    } catch {
        // В случае ошибки парсинга URL разрешаем доступ
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
          console.log(rulesForOurAgent)
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
