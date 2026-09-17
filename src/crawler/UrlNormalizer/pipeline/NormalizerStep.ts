import { NormalizationContext } from "./NormalizationContext.js";

export interface NormalizerStep {
    process(context: NormalizationContext): NormalizationContext;
}