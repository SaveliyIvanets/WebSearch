import { Strategy } from "../strategy.js";

export interface IDNStrategy extends Strategy<string> {
    apply(hostname: string): string;

    isIDN(hostname: string): boolean;
}