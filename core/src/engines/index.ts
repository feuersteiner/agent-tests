import type { AgentTestEngines, AgentTestEnginesConfig, AgentTestEnv } from './types.ts';
import { createDecideEngine } from './decide.ts';
import { createGlobEngine } from './glob.ts';
import { createGrepEngine } from './grep.ts';
import { createReasonEngine } from './reason.ts';

/** Creates independent pattern caches and lazily initialized AI models; throws when an API key is missing from `env`. */
export const createEngines = (
	settings: AgentTestEnginesConfig,
	env: AgentTestEnv
): AgentTestEngines => ({
	glob: createGlobEngine(),
	grep: createGrepEngine(),
	decide: createDecideEngine(settings.decision, env),
	reason: createReasonEngine(settings.reasoning, env)
});
