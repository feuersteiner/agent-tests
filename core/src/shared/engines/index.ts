import type { AiSettings } from './types.ts';
import { createDecideEngine } from './decide.ts';
import { createGlobEngine } from './glob.ts';
import { createGrepEngine } from './grep.ts';
import { createReasonEngine } from './reason.ts';

/** Creates independent pattern caches and lazily initialized AI models. */
export const createEngines = (settings: AiSettings) => ({
	glob: createGlobEngine(),
	grep: createGrepEngine(),
	decide: createDecideEngine(settings.decision),
	reason: createReasonEngine(settings.reasoning)
});
