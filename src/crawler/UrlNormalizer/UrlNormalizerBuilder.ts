import { UrlNormalizer } from "./UrlNormalizer.js"

// стратегии

import { DuplicateParamStrategy } from "./strategies/duplicate/DuplicateParamStrategy.js";
import { KeepFirstDuplicateStrategy } from "./strategies/duplicate/KeepFirstDuplicateStrategy.js";
import { KeepLastDuplicateStrategy } from "./strategies/duplicate/KeepLastDuplicateStrategy.js";
import { MergeDuplicateStrategy } from "./strategies/duplicate/MergeDuplicateStrategy.js";
  
import {
    WWWStrategy,
    RemoveWWWStrategy,
    AddWWWStrategy,
    KeepWWWStrategy,
} from './strategies/wwwStrategies.js';

import { DEFAULT_OPTIONS } from './DefaultOptions.js';


export interface UrlNormalizerOptions {
    sortQuery: boolean;
    removeTrackingParams: boolean;
    trackingParams: Set<string>;
    removeEmptyParams: boolean;
    duplicateStrategy: DuplicateParamStrategy;
    wwwStrategy: WWWStrategy;
}

export class UrlNormalizerBuilder {
    private options: Partial<UrlNormalizerOptions> = {};

    // ============ QUERY ОПЦИИ ============

    withSortQuery(enable: boolean): this {
        this.options.sortQuery = enable;
        return this;
    }

    withTrackingRemoval(enable: boolean): this {
        this.options.removeTrackingParams = enable;
        return this;
    }

    withCustomTrackingParams(params: Set<string>): this {
        this.options.trackingParams = params;
        return this;
    }

    withEmptyParamsRemoval(enable: boolean): this {
        this.options.removeEmptyParams = enable;
        return this;
    }

    // ============ СТРАТЕГИИ ДУБЛИКАТОВ ============

    private withDuplicateStrategy(strategy: DuplicateParamStrategy): this {
        this.options.duplicateStrategy = strategy;
        return this;
    }

    withKeepFirstDuplicates(): this {
        return this.withDuplicateStrategy(new KeepFirstDuplicateStrategy());
    }

    withKeepLastDuplicates(): this {
        return this.withDuplicateStrategy(new KeepLastDuplicateStrategy());
    }

    withMergeDuplicates(join: string = ','): this {
        return this.withDuplicateStrategy(new MergeDuplicateStrategy(join));
    }

    // ============ WWW СТРАТЕГИИ ============

    private withWWWStrategy(strategy: WWWStrategy): this {
        this.options.wwwStrategy = strategy;
        return this;
    }

    withWWWRemoval(): this {
        return this.withWWWStrategy(new RemoveWWWStrategy());
    }

    withWWWAddition(): this {
        return this.withWWWStrategy(new AddWWWStrategy());
    }

    withWWWKeep(): this {
        return this.withWWWStrategy(new KeepWWWStrategy());
    }

    // ============ ПОСТРОЕНИЕ ============

    build(): UrlNormalizer {
        const finalOptions: UrlNormalizerOptions  = {
            ...DEFAULT_OPTIONS,
            ...this.options,
        };

        return new UrlNormalizer(finalOptions);
    }

}