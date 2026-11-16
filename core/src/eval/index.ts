import type { AssertOrchestrator } from '../assert/index.ts';
import { EVAL_FILE } from '../loader/index.ts';
import type { AgentTestDefinition } from '../loader/types.ts';
import type { ScopeOrchestrator } from '../scope/index.ts';
import type { SelectOrchestrator } from '../select/index.ts';
import type { AgentTestEvalDefinition, AgentTestEvalResult, AgentTestOutcome } from './types.ts';

/** Runs a Test with an eval folder as the root and gives its actual outcome. */
export class EvalOrchestrator {
	constructor(
		private readonly scope: ScopeOrchestrator,
		private readonly select: SelectOrchestrator,
		private readonly assert: AssertOrchestrator
	) {}

	/** The eval with its actual outcome, and findings. */
	public readonly run = async (
		test: AgentTestDefinition,
		definition: AgentTestEvalDefinition
	): Promise<AgentTestEvalResult> => {
		console.log(`Eval ${definition.id}`);
		const sources = this.scope
			.runFolder(definition.root)
			.filter((source) => source.path !== EVAL_FILE);
		const selected = await this.select.run(test.select, sources);
		const findings = selected.length ? await this.assert.run(test.assert, selected) : [];
		const actual: AgentTestOutcome = !selected.length ? 'skip' : findings.length ? 'fail' : 'pass';
		console.log(`Expected ${definition.expect}, got ${actual}`);
		return { eval: definition, actual, findings };
	};
}
