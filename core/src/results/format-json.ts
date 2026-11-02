import type { RunResult } from './types.js';

/** Serialize the complete stable result contract for tools and CI. */
export const formatJson = (result: RunResult): string => JSON.stringify(result, null, 2);
