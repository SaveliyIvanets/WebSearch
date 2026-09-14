import { NormalizerStep } from '../pipeline/NormalizerStep.js';
import { NormalizationContext } from '../pipeline/NormalizationContext.js';
import { IDNStrategy } from '../strategies/idn/IDNStrategy.js';
import { WWWStrategy } from '../strategies/www/WWWStrategy.js';


export class HostnameNormalizationStep implements NormalizerStep {
    constructor (
        private readonly IdnStrategy: IDNStrategy,
        private readonly wwwStrategy: WWWStrategy
    ) {}

    process(context: NormalizationContext) {
        let hostname = context.url.hostname;
        
        //нижний регистр
        hostname = hostname.toLowerCase();

        //IDN стратегия
        const beforeIdn = hostname;
        hostname = this.IdnStrategy.apply(hostname);
        if (hostname !== beforeIdn) {
            context.setMetadata('idnConverted', true);
        }

        const beforeWWW = hostname;
        hostname = this.wwwStrategy.apply(hostname);
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