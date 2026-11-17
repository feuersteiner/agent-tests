export const ping = () => fetch('/health', { signal: AbortSignal.timeout(2000) });
