// How many times a failed webhook is retried before it is dropped.
export const WEBHOOK_RETRIES = 4;
export const RETRY_BACKOFF_MS = 2 * 60 * 1000;
