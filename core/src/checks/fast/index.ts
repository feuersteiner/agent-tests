import type { FastCheck } from '../../schema/index.js';
import { scanPatterns } from './scan-patterns.js';

/** Separate definite violations from weak hints without contacting a model. */
export const evaluateFast = (fast: FastCheck | undefined, content: string) => ({
	matches: scanPatterns(fast?.match, content),
	hints: scanPatterns(fast?.maybe, content)
});
