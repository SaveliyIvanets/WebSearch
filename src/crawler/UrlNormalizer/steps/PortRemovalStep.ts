import { NormalizerStep } from "../pipeline/NormalizerStep.js";
import { NormalizationContext } from "../pipeline/NormalizationContext.js";

export class PortRemovalStep implements NormalizerStep {
    process(context: NormalizationContext) {
    
        if ((context.url.protocol === 'http:' && context.url.port === '80') ||
            (context.url.protocol === 'https:' && context.url.port === '443')) {
            context.url.port = '';
        }
        
        return context;
      }
    }