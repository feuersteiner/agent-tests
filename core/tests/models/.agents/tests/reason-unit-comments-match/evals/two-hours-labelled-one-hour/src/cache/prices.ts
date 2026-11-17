import { createCache } from './create-cache.ts';

const PRICE_CACHE_TTL_SECONDS = 7200; // 1 hour

export const priceCache = createCache({ ttlSeconds: PRICE_CACHE_TTL_SECONDS });
