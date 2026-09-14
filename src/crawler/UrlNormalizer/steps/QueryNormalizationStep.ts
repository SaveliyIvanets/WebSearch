import { NormalizerStep } from '../pipeline/NormalizerStep.js';
import { NormalizationContext } from '../pipeline/NormalizationContext.js';
import { DuplicateParamStrategy } from '../strategies/duplicate/DuplicateParamStrategy.js';
import { QueryParser } from '../utils/QueryParser.js';


export class QueryNormalizationStep implements NormalizerStep {
    constructor(
        private readonly duplicateStrategy: DuplicateParamStrategy,
        private readonly trackingStrategy: string[],
        private readonly sortQuery: boolean,
        private readonly removeEmptyParams: boolean
    ) {}

    process(context: NormalizationContext) {
        const query = context.url.search;

        if (!query || query === '?') {
            return context;
        }

        let entries = QueryParser.parse(query);

        if (this.removeEmptyParams) {
            //добить
            //проверить, были ли
        }

        if (this.trackingStrategy.length) {
            //добить
            //проверить, удалялись ли
        }

        entries = this.duplicateStrategy.apply(entries);
        // проверить, изменился ли entries

        if (this.sortQuery) {
            entries = this.sortEntries(entries);
        }

        context.url.search = this.buildQueryString(entries);

        return context;
    }

    private sortEntries(entries: [string, string][]): [string, string][] {
        return entries.sort(([a], [b]) => a.localeCompare(b));
    }

    private buildQueryString(entries: [string, string][]): string {
        if (entries.length === 0) {
          return '';
        }
        return '?' + entries.map(([k, v]) => `${k}=${v}`).join('&');
      }
    }
}