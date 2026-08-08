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
        return bestType !== 'disallow';
    } catch {
        // В случае ошибки парсинга URL разрешаем доступ
      return true;
    }
  }

  _parseRobotsTxt(html) {
    if (!html) return;
    const lines = html.split("\n");
    let forUs = false;
    for (const line of lines) {
      const [key, ...val] = line.trim().split(":");
      const trimmedKey = key.trim().toLowerCase();
      const trimmedValue = val.join(":").trim();
      if (trimmedKey === "user-agent") {
        if (trimmedValue === "*") {
          forUs = true;
        } else {
          forUs = false;
        }
        continue;
      }
      if (forUs) {
        this._addToDisallowedPaths(trimmedKey, trimmedValue);
      }
    }
  }
}
export { RobotsParser };
