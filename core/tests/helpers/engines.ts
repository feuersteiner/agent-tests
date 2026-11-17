import type { AgentTestEngine, AgentTestEngines } from '../../src/engines/types.ts';
import type { AgentTestParam } from '../../src/types.ts';

/** One call a stub engine received. */
export interface EngineCall {
	engine: 'glob' | 'grep' | 'decide' | 'reason';
	input: string;
	criteria: AgentTestParam;
}

/** A stub implementation: returns the score for an input and criteria. */
type Implementation = (input: string, criteria: AgentTestParam) => number | Promise<number>;

/** Stub engines that record every call in `calls`, in order; an engine without an implementation rejects when called. */
export const stubEngines = (
	implementations: Partial<Record<keyof AgentTestEngines, Implementation>> = {}
): { engines: AgentTestEngines; calls: EngineCall[] } => {
	const calls: EngineCall[] = [];
	const toEngine =
		(engine: keyof AgentTestEngines): AgentTestEngine =>
		async (input, criteria) => {
			calls.push({ engine, input, criteria });
			const implementation = implementations[engine];
			if (!implementation) throw new Error(`Stub engine ${engine} has no implementation`);
			return implementation(input, criteria);
		};
	return {
		engines: {
			glob: toEngine('glob'),
			grep: toEngine('grep'),
			decide: toEngine('decide'),
			reason: toEngine('reason')
		},
		calls
	};
};
