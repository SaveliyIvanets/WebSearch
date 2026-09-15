import { IDNStrategy } from "./IDNStrategy.js";
import punycode from 'punycode/';

export class PunycodeIDNStrategy implements IDNStrategy {
    apply(hostname: string): string {
        if (!this.isIDN(hostname)) {
            return hostname;
        }

        try {
            return punycode.toASCII(hostname);
        } catch (error) {
            throw new Error('Ошибка конвертации доменного имени в ASCII');
        }
    }

    isIDN(hostname: string): boolean {
        return /[^\x00-\x7F]/.test(hostname);
    }
}