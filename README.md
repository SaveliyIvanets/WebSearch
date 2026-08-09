⚠️ WIP (Work In Progress)

# Logging

Проект использует структурированную систему логирования через класс `Logger` (`src/logger/Logger.ts`).

## Уровни

`debug` → `info` → `warn` → `error` → `silent`. По умолчанию — `info`. Логи ниже установленного уровня подавляются; `silent` отключает весь вывод.

## Использование

```ts
import { Logger } from "./logger/Logger.js";

const logger = new Logger({ level: "info", prefix: "[Crawler]" });

logger.debug("Processing links", { count: 42 }); // не выведется при level: info
logger.info("Starting crawl", { url: "https://example.com" });
logger.warn("Slow response", { url: "https://example.com", time: 5000 });
logger.error("Request failed", { url: "https://example.com", error });
```

## Конфигурация

```ts
logger.setLevel("error"); // переключить уровень в рантайме
logger.isEnabled("debug"); // проверить, активен ли уровень
```

Каждая запись содержит timestamp (ISO), уровень, префикс, сообщение и опциональный `meta`.

## Транспорт

По умолчанию записи выводятся в `console`. Можно задать свой транспорт (запись в файл, отправку во внешний сервис):

```ts
const logger = new Logger({
  transport: (entry) => writeToFile(JSON.stringify(entry)),
});
```

## Тесты

```bash
npm test
```

