import { NormalizerStep } from '../pipeline/NormalizerStep.js';
import { NormalizationContext } from '../pipeline/NormalizationContext.js';
import { DuplicateParamStrategy } from '../strategies/duplicate/DuplicateParamStrategy.js';

type QueryParam = [string, string];

export class QueryNormalizationStep implements NormalizerStep {
    constructor(
        private readonly duplicateStrategy: DuplicateParamStrategy,
        private readonly trackingParams: Set<string>,
        private readonly sortQuery: boolean,
        private readonly removeEmptyParams: boolean
    ) {}

    process(context: NormalizationContext) {
        const query = context.url.search;

        if (!query || query === '?') {
            return context;
        }

        let entries = this.parseParams(query);

        if (this.removeEmptyParams) {
            const beforeRemove = entries;
            entries = entries.filter(param => param[1] !== "");
            if (entries.length !== beforeRemove.length) {
                context.setMetadata('isEmptyRemoved', true);
            }
        }

        if (this.trackingParams.size) {
            const beforeTracking = entries;
            entries = entries.filter(param => !this.trackingParams.has(param[0]))
            if (entries.length !== beforeTracking.length) {
                context.setMetadata('isTrackingRemoved', true);
            }
        }

        const beforeDuplicated = entries;
        entries = this.duplicateStrategy.apply(entries);
        if (entries.length !== beforeDuplicated.length) {
            context.setMetadata('isTrackingRemoved', true);
        }

        if (this.sortQuery) {
            entries = this.sortEntries(entries);
        }

        context.url.search = this.buildQueryString(entries);

        return context;
    }

    private sortEntries(entries: QueryParam[]): QueryParam[] {
        return entries.sort(([a], [b]) => a.localeCompare(b));
    }

    private buildQueryString(entries: QueryParam[]): string {
        if (entries.length === 0) {
          return '';
        }
        return '?' + entries.map(([k, v]) => `${k}=${v}`).join('&');
      }

    private parseParams(query: string): QueryParam[] {
        let params = query.startsWith('?') ? query.slice(1) : query;
        if (!params) {
            return [];
        }
        
        const result: QueryParam[] = [];
        const pairs = params.split('&');

        for (const pair of pairs) {
            let key: string;
            let value: string;
            const equalIndex = pair.indexOf('=');

            if (equalIndex === -1) {
                key = pair;
                value = "";
            } else {
                key = pair.substring(0, equalIndex);
                value = pair.substring(equalIndex + 1);
            }

            result.push([key, value]);
        }

        return result;
    }
}
