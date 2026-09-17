import { NormalizerStep } from '../pipeline/NormalizerStep.js';
import { NormalizationContext } from '../pipeline/NormalizationContext.js';


export class HostnameNormalizationStep implements NormalizerStep {
    process(context: NormalizationContext) {
        const opts = context.options;
        let hostname = context.url.hostname;
        
        //нижний регистр
        hostname = hostname.toLowerCase();

        const beforeWWW = hostname;
        hostname = opts.wwwStrategy.apply(hostname);
        if (hostname !== beforeWWW) {
            context.setMetadata('wwwChanged', true);
        }

        if (hostname !== context.url.hostname) {
            context.setMetadata('hostnameChanged', true);
        }

        context.url.hostname = hostname;
        return context;
    }
}