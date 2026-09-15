import { NormalizerStep } from "../pipeline/NormalizerStep.js";
import { NormalizationContext } from "../pipeline/NormalizationContext.js";
import { PercentEncoder } from "../utils/PercentEncoder.js";

export class PercentEncodingStep implements NormalizerStep {
    process(context: NormalizationContext): NormalizationContext {      
      context.url.pathname = PercentEncoder.normalize(context.url.pathname);
      return context;
    }
}