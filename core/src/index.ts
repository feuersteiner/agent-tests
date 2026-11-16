import { AssertOrchestrator } from './assert/index.ts';
import type { AgentTestFinding } from './assert/types.ts';
import { createEngines } from './engines/index.ts';
import type { AgentTestEngines } from './engines/types.ts';
import { loadDefinitions } from './loader/index.ts';
import type { AgentTestConfig, AgentTestDefinition } from './loader/types.ts';
import { ScopeOrchestrator } from './scope/index.ts';
import type { AgentTestScope } from './scope/types.ts';
import { SelectOrchestrator } from './select/index.ts';
import type { Source } from './sources/index.ts';

/** One Test's outcome in a run: the Test and the findings against it. */
export interface AgentTestResult {
	test: AgentTestDefinition;
	findings: AgentTestFinding[];
}

/** The main class: builds every component from the config and coordinates a run. */
export class AgentTests {
	private readonly engines: AgentTestEngines;
	private readonly scope: ScopeOrchestrator;
	private readonly select: SelectOrchestrator;
	private readonly assert: AssertOrchestrator;

	constructor(config: AgentTestConfig) {
		this.engines = createEngines(config);
		this.scope = new ScopeOrchestrator(config.ignore);
		this.select = new SelectOrchestrator(this.engines, config.select);
		this.assert = new AssertOrchestrator(this.engines, config.assert);
	}

	/** Runs every Test, or only the one named `id`, over the sources in scope; one result per Test. */
	public readonly run = async (scope: AgentTestScope, id?: string): Promise<AgentTestResult[]> => {
		const tests = loadDefinitions(id);
		const sources = this.scope.run(scope);
		const results: AgentTestResult[] = [];
		for (const test of tests) results.push(await this.runTest(test, sources));
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
}
