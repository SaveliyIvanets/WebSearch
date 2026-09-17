import { NormalizerStep } from "../pipeline/NormalizerStep.js";
import { NormalizationContext } from "../pipeline/NormalizationContext.js";

export class FragmentRemovalStep implements NormalizerStep {
    process(context: NormalizationContext): NormalizationContext {
        context.url.hash = '';
        return context;
    }
}