import { UrlObject } from 'url';
import { UrlNormalizerOptions } from '../UrlNormalizerBuilder.js';

export class NormalizationContext {
    url: UrlObject;

    constructor(rawUrl: string, options: UrlNormalizerOptions) {
        this.url = new URL(rawUrl);
    }
}