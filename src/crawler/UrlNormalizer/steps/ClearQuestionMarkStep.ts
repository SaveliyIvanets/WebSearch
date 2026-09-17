import { NormalizerStep } from "../pipeline/NormalizerStep.js";
import { NormalizationContext } from "../pipeline/NormalizationContext.js";

export class ClearQuestionMarkStep implements NormalizerStep {
    process(context: NormalizationContext): NormalizationContext {
        context.url.href = context.url.href.replace(/\?$/, '');
        console.log()
        return context;
    }
}