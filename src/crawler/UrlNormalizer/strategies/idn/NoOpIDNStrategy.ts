import { IDNStrategy } from './IDNStrategy.js';

export class NoOpIDNStrategy implements IDNStrategy {
  apply(hostname: string): string {
    return hostname;
  }

  isIDN(hostname: string): boolean {
    return /[^\x00-\x7F]/.test(hostname);
  }
}