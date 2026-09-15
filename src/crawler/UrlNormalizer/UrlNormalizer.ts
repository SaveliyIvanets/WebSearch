
// класс пайплайна и контекста для него(вроде класс)
import { NormalizationPipeline } from './pipeline/NormalizationPipeline.js';
import { NormalizationContext } from './pipeline/NormalizationContext.js';

// интерфейсы
import { UrlNormalizerOptions } from './UrlNormalizerBuilder.js'

//шаги пайплайна
import { FragmentRemovalStep } from './steps/FragmentRemovalStep.js';
import { PortRemovalStep } from './steps/PortRemovalStep.js';
import { TrailingSlashStep } from './steps/TrailingSlashStep.js';
import { HostnameNormalizationStep } from './steps/HostnameNormalizationStep.js';
import { QueryNormalizationStep } from './steps/QueryNormalizationStep.js';
import { PercentEncodingStep } from './steps/PercentEncodingStep.js';

//стратегии по умолчанию
import { KeepFirstDuplicateStrategy } from './strategies/duplicate/KeepFirstDuplicateStrategy.js';
import { KeepWWWStrategy } from './strategies/wwwStrategies.js';
import { PunycodeIDNStrategy } from './strategies/idn/PunycodeIDNStrategy.js';

export class UrlNormalizer {
    private readonly pipeline: NormalizationPipeline;
    private readonly options: UrlNormalizerOptions;

    constructor(options: UrlNormalizerOptions) {
        this.options = this.normalizeOptions(options);
        this.pipeline = this.buildPipeline();
    }

    private buildPipeline(): NormalizationPipeline {
        const steps = [
            new FragmentRemovalStep(),
            new PortRemovalStep(),
            new HostnameNormalizationStep(
                this.options.idnStrategy ?? new PunycodeIDNStrategy(),
                this.options.wwwStrategy ?? new KeepWWWStrategy()
            ),
            new PercentEncodingStep(),
            new QueryNormalizationStep(
                this.options.duplicateStrategy ?? new KeepFirstDuplicateStrategy(),
                this.options.trackingParams ?? new Set(),
                this.options.sortQuery ?? true,
                this.options.removeEmptyParams ?? true
            ),
            new TrailingSlashStep()
        ];

        return new NormalizationPipeline(steps);
    }

    private normalizeOptions(options: UrlNormalizerOptions): UrlNormalizerOptions {
        return {
          sortQuery: options.sortQuery ?? true,
          removeTrackingParams: options.removeTrackingParams ?? true,
          removeEmptyParams: options.removeEmptyParams ?? true,
          duplicateStrategy: options.duplicateStrategy ?? new KeepFirstDuplicateStrategy(),
          wwwStrategy: options.wwwStrategy ?? new KeepWWWStrategy(),
          idnStrategy: options.idnStrategy ?? new PunycodeIDNStrategy(),
          trackingParams: options.trackingParams ?? [],
        };
    }

    normalize(rawUrl: string): string | null {
        try {
            const context = new NormalizationContext(rawUrl, this.options);
            const result = this.pipeline.execute(context);

            if (!result) return null;

            return result.url.href;
        } catch {
            // тут лог ошибок
            return null;
        }
    }
}