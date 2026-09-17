import { NormalizationContext } from "../pipeline/NormalizationContext.js";
import { NormalizerStep } from "../pipeline/NormalizerStep.js";

export class TrailingSlashStep implements NormalizerStep {
  
    process(context: NormalizationContext): NormalizationContext {      
      const path = context.url.pathname;
      if (path !== '/' && path.endsWith('/')) {
        context.url.pathname = path.replace(/\/+$/, '');
      }
      
      return context;
    }
}