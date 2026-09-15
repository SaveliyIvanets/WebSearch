import { NormalizationContext } from './NormalizationContext.js';
import { NormalizerStep } from './NormalizerStep.js';

export class NormalizationPipeline {
    constructor(private readonly steps: NormalizerStep[]) {}

    execute(context: NormalizationContext): NormalizationContext | null {
        let currentContext = context;

        for (let i = 0; i < this.steps.length; i++) {
            const step = this.steps[i];

            try {
                const result = step.process(context);

                //пока нет шагов, возвращающих null
                if (result === null) {
                    return null;
                }

                currentContext = result;
            } catch (error){
                console.error(`Step ${step.constructor.name} failed:`, error);
                return null;
            }
        }

        return currentContext;
    }
}