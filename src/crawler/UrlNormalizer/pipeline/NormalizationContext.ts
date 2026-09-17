import { UrlNormalizerOptions } from '../UrlNormalizerBuilder.js';

export class NormalizationContext {
  public readonly url: URL;
  public readonly options: UrlNormalizerOptions;
  public readonly metadata: Map<string, any>;
  public readonly originalUrl: string;

  constructor(rawUrl: string, options: UrlNormalizerOptions) {
    this.originalUrl = rawUrl;
    this.url = new URL(rawUrl);
    this.options = options;
    this.metadata = new Map();
  }

  // Удобные хелперы
  hasMetadata(key: string): boolean {
    return this.metadata.has(key);
  }

  getMetadata<T>(key: string): T | undefined {
    return this.metadata.get(key) as T;
  }

  setMetadata<T>(key: string, value: T): void {
    this.metadata.set(key, value);
  }

  // Клонирование для иммутабельности
  clone(): NormalizationContext {
    const context = new NormalizationContext(this.originalUrl, this.options);
    context.url.href = this.url.href;
    context.metadata.clear();
    for (const [key, value] of this.metadata) {
      context.metadata.set(key, value);
    }
    return context;
  }
}