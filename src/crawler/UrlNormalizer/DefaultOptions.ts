// src/crawler/UrlNormalizer/DefaultOptions.ts

import { UrlNormalizerOptions } from './UrlNormalizerBuilder.js';

import { KeepFirstDuplicateStrategy } from './strategies/duplicate/KeepFirstDuplicateStrategy.js';
import { KeepWWWStrategy } from './strategies/wwwStrategies.js';

/**
 * Список трекинговых/аналитических параметров по умолчанию.
 *
 * Используется для удаления из query-строки при нормализации.
 * Список можно расширить через UrlNormalizerBuilder.withCustomTrackingParams().
 */
export const DEFAULT_TRACKING_PARAMS: readonly string[] = [
  // Google Analytics / UTM
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
  'utm_source_platform',
  'utm_creative_format',
  'utm_marketing_tactic',

  // Facebook
  'fbclid',

  // Google Ads
  'gclid',
  'dclid',
  'gbraid',
  'wbraid',

  // Microsoft Ads
  'msclkid',

  // Yandex
  'yclid',
  '_ym_uid',
  '_ym_d',
  '_ym_isad',

  // Mail.ru
  '_openstat',

  // Прочие
  'ref',
  'referrer',
  'source',
  'si',
  'mc_cid',
  'mc_eid',
  'igshid',
  'vero_id',
  'vero_conv',
  '_ga',
  '_gl',
  'twclid',
  'ttclid',
] as const;

/**
 * Дефолтные опции для UrlNormalizer.
 *
 * Используются как база при построении через Builder —
 * клиент может переопределить любую опцию.
 */
export const DEFAULT_OPTIONS: UrlNormalizerOptions = {
  // Query-нормализация
  sortQuery: true,
  removeTrackingParams: true,
  trackingParams: new Set(DEFAULT_TRACKING_PARAMS),
  removeEmptyParams: true,

  // Стратегии
  duplicateStrategy: new KeepFirstDuplicateStrategy(),
  wwwStrategy: new KeepWWWStrategy(),
};