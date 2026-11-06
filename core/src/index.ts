import { TestCheck } from './check/index.ts';
import type { Check } from './check/types.ts';
import { validateConfig, validateTest } from './config/validate.ts';
import { TestEval } from './evals/index.ts';
import type { Eval } from './evals/types.ts';
import { buildDecisionAI, buildReasoningAI } from './shared/ai/models.ts';
import type { Source } from './shared/source.ts';
import type { Result } from './shared/types.ts';
import { TestTrigger } from './trigger/index.ts';
import type {
	AgentTest as AgentTestDefinition,
	AgentTestConfig,
	AgentTestResult
} from './types.ts';

/** Run one validated test over the sources: triggers select and checks judge. Evals run on demand. */
export class AgentTest {
	public readonly test: AgentTestDefinition;
	public readonly trigger: TestTrigger;
	public readonly check: TestCheck;
	public evals?: TestEval;

	/**
	 * @param sources - Files to inspect, as supplied by the caller.
	 * @param yaml - The parsed test.yaml value; text parsing belongs to src/config.
	 * @param config - Provider models and settings for the trigger and check stages.
	 * @throws If the test definition or config is invalid, or a required environment key is empty.
	 */
	constructor(
		public readonly sources: Source[],
		yaml: unknown,
		config: AgentTestConfig
	) {
		this.test = validateTest(yaml);
		const settings = validateConfig(config);
		const decisionAi = buildDecisionAI(settings.decision);
		const reasoningAi = buildReasoningAI(settings.reasoning);
		this.trigger = new TestTrigger(this.test.triggers ?? [], {
			...settings.trigger,
			ai: decisionAi
		});
		this.check = new TestCheck(this.test.checks, { ...settings.check, decisionAi, reasoningAi });
	}

	/** Run triggers, then checks on the selected sources; verbose logs each entry and a summary. */
	public readonly run = async (verbose = false): Promise<AgentTestResult> => {
		console.log(`Agent test "${this.test.title}" running...`);
		const trigger = await this.trigger.run(this.sources, verbose);
		const selected = this.trigger.selected(this.sources, trigger);
		const check = await this.check.run(selected, verbose);
		if (verbose) this.log(selected, check);
		return { trigger, check };
	};

	/** Create the eval stage on first use and run it; verbose logs each entry as it finishes. */
	public readonly eval = (verbose = false): Promise<Result<Eval>> => {
		this.evals ??= new TestEval(this.test.evals);
		return this.evals.run(this.trigger, this.check, verbose);
	};

	private readonly log = (selected: Source[], { flagged, cleared }: Result<Check>): void => {
		console.log(
			`Summary: ${selected.length} of ${this.sources.length} sources selected; ` +
				`checks: ${flagged.length} flagged, ${cleared.length} cleared`
		);
	};
}
