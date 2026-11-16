import { AssertOrchestrator } from './assert/index.ts';
import type { AgentTestResult } from './assert/types.ts';
import { createEngines } from './engines/index.ts';
import type { AgentTestEngines } from './engines/types.ts';
import { EvalOrchestrator } from './eval/index.ts';
import type {
	AgentTestEvalDefinition,
	AgentTestEvalResult,
	AgentTestEvalsResult
} from './eval/types.ts';
import { loadDefinitions, loadEvalDefinitions } from './loader/index.ts';
import type { AgentTestConfig, AgentTestDefinition } from './loader/types.ts';
import { ScopeOrchestrator } from './scope/index.ts';
import type { AgentTestScope } from './scope/types.ts';
import { SelectOrchestrator } from './select/index.ts';
import type { Source } from './sources/index.ts';

/** The main class: builds every component from the config and coordinates a run or an eval. */
export class AgentTests {
	private readonly engines: AgentTestEngines;
	private readonly scope: ScopeOrchestrator;
	private readonly select: SelectOrchestrator;
	private readonly assert: AssertOrchestrator;
	private readonly evaluate: EvalOrchestrator;

	constructor(config: AgentTestConfig) {
		this.engines = createEngines(config);
		this.scope = new ScopeOrchestrator(config.ignore);
		this.select = new SelectOrchestrator(this.engines, config.select);
		this.assert = new AssertOrchestrator(this.engines, config.assert);
		this.evaluate = new EvalOrchestrator(this.scope, this.select, this.assert);
	}

	/** Runs every Test, or only the one named `id`, over the sources in scope; one result per Test. */
	public readonly run = async (scope: AgentTestScope, id?: string): Promise<AgentTestResult[]> => {
		const tests = loadDefinitions(id);
		const sources = this.scope.run(scope);
		const results: AgentTestResult[] = [];
		for (const test of tests) results.push(await this.runTest(test, sources));
		return results;
	};

	/** Runs every Test, or only the one named `id`, on each of its eval folders; one result per Test. */
	public readonly eval = async (id?: string): Promise<AgentTestEvalsResult[]> => {
		const tests = loadDefinitions(id).map((test) => ({
			test,
			evals: loadEvalDefinitions(test.id)
		}));
		const results: AgentTestEvalsResult[] = [];
		for (const { test, evals } of tests) results.push(await this.evalTest(test, evals));
		return results;
	};

	/** Selects the sources one Test inspects, then asserts on them. */
	private readonly runTest = async (
		test: AgentTestDefinition,
		sources: Source[]
	): Promise<AgentTestResult> => {
		console.log(`Test ${test.id}`);
		const selected = await this.select.run(test.select, sources);
		const findings = await this.assert.run(test.assert, selected);
		return { test, findings };
	};

	/** Runs one Test on each of its eval folders, one after another. */
	private readonly evalTest = async (
		test: AgentTestDefinition,
		evals: AgentTestEvalDefinition[]
	): Promise<AgentTestEvalsResult> => {
		console.log(`Test ${test.id}`);
		const results: AgentTestEvalResult[] = [];
		for (const definition of evals) results.push(await this.evaluate.run(test, definition));
		return { test, evals: results };
	};
}
