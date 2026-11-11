import { TestCheck } from './check/index.ts';
import type { Check } from './check/types.ts';
import { validateConfig, validateTests } from './config/validate.ts';
import { TestEval } from './evals/index.ts';
import { AI } from './shared/deprecated-ai/index.ts';
import type { Source } from './shared/sources/index.ts';
import type { Result } from './shared/types.ts';
import { TestTrigger } from './trigger/index.ts';
import type { AgentTest, AgentTestConfig, AgentTestEvalResult, AgentTestResult } from './types.ts';

/** Run each validated test's triggers and checks independently over shared sources. */
export class AgentTests {
	public readonly tests: AgentTest[];
	private readonly config: AgentTestConfig;
	private ai?: AI;

	/**
	 * @param sources - Shared base sources supplied by the caller; each test selects its own targets.
	 * @param definitions - Parsed test definitions; text parsing belongs to src/config.
	 * @param config - Shared provider models and stage settings, validated here.
	 * @throws If any definition or config is invalid, including duplicate test IDs.
	 */
	constructor(
		public readonly sources: Source[],
		definitions: unknown,
		config: unknown
	) {
		this.tests = validateTests(definitions);
		this.config = validateConfig(config);
	}

	/** Run each test over the shared base; return groups in definition order. */
	public readonly run = async (verbose = false): Promise<(AgentTestResult & { id: string })[]> => {
		return Promise.all(
			this.tests.map(async (test) => {
				const ai = (this.ai ??= new AI(this.config));
				const trigger = new TestTrigger(test.triggers ?? [], { ...this.config.trigger, ai });
				const check = new TestCheck(test.checks, { ...this.config.check, ai });
				console.log(`Agent test "${test.title}" (${test.id}) running...`);
				const triggered = await trigger.run(this.sources, verbose);
				const selected = trigger.selected(this.sources, triggered);
				const checked = await check.run(selected, verbose);
				if (verbose) this.log(test.id, selected, checked);
				return { id: test.id, trigger: triggered, check: checked };
			})
		);
	};

	/** Run each test's labeled examples using fresh stages and the shared AI. */
	public readonly eval = async (verbose = false): Promise<AgentTestEvalResult[]> => {
		return Promise.all(
			this.tests.map(async (test) => {
				const ai = (this.ai ??= new AI(this.config));
				const trigger = new TestTrigger(test.triggers ?? [], { ...this.config.trigger, ai });
				const check = new TestCheck(test.checks, { ...this.config.check, ai });
				const evals = new TestEval(test.evals);
				const { id } = test;
				if (verbose) console.log(`Agent test ${id} evaluating...`);
				const result = await evals.run(trigger, check, verbose);
				if (verbose)
					console.log(
						`Summary ${id}: evals: ${result.flagged.length} flagged, ${result.cleared.length} cleared`
					);
				return { id, result };
			})
		);
	};

	private readonly log = (
		id: string,
		selected: Source[],
		{ flagged, cleared }: Result<Check>
	): void => {
		console.log(
			`Summary ${id}: ${selected.length} of ${this.sources.length} sources selected; ` +
				`checks: ${flagged.length} flagged, ${cleared.length} cleared`
		);
	};
}
