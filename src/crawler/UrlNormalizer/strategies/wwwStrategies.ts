import { Strategy } from "./strategy.js";

export interface WWWStrategy extends Strategy<string> {
    apply(hostname: string): string;
}

export class RemoveWWWStrategy implements WWWStrategy {
    private readonly WWW_PREFIX = "www."
    apply(hostname: string): string {
        if (hostname.startsWith(this.WWW_PREFIX)
            && hostname.length > this.WWW_PREFIX.length) {
            return hostname.slice(this.WWW_PREFIX.length);
        }

        return hostname;
    }
}

export class AddWWWStrategy implements WWWStrategy {
    private readonly WWW_PREFIX = 'www.';
  
    apply(hostname: string): string {
      if (this.shouldApply(hostname)) {
        return `${this.WWW_PREFIX}${hostname}`;
      }
      return hostname;
    }
  
    shouldApply(hostname: string): boolean {
      if (hostname.startsWith(this.WWW_PREFIX)) {
        return false;
      }
      
      if (!hostname || hostname === 'localhost') {
        return false;
      }
      
      if (this.isIpAddress(hostname)) {
        return false;
      }
      
      return true;
    }
  
    private isIpAddress(hostname: string): boolean {
      // IPv4
      if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
        return true;
      }
      // IPv6 в скобках
      if (hostname.startsWith('[') && hostname.endsWith(']')) {
        return true;
      }
      return false;
    }
}

export class KeepWWWStrategy implements WWWStrategy {

    apply(hostname: string): string {
        return hostname;
    }
}