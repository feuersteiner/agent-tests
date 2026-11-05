import { TestCheck } from './check/index.ts';
import type { Check } from './check/types.ts';
import { StubAI } from './shared/ai/stub.ts';
import type { Source } from './shared/source.ts';
import type { Result } from './shared/types.ts';
import { TestTrigger } from './trigger/index.ts';
import type {
	AgentTest as AgentTestDefinition,
	AgentTestConfig,
	AgentTestResult
} from './types.ts';
import { Validator } from './validator.ts';

/** Run one validated test over the sources: triggers select and checks judge. Evals run on demand. */
export class AgentTest {
	public readonly test: AgentTestDefinition;
	public readonly trigger: TestTrigger;
	public readonly check: TestCheck;

	/**
	 * @param sources - Files to inspect, as supplied by the caller.
	 * @param yaml - The parsed test.yaml value; parsing the text belongs to the CLI.
	 * @param config - Settings for the trigger and check stages.
	 * @throws If the test definition is invalid.
	 */
	constructor(
		public readonly sources: Source[],
		yaml: unknown,
		config: AgentTestConfig
	) {
		this.test = new Validator().run(yaml);
		// TODO: Stubs for now: DecisionAI and ReasoningAI need real SDK models, which are not connected yet.
		const decisionAi = new StubAI();
		const reasoningAi = new StubAI();
		this.trigger = new TestTrigger(this.test.triggers ?? [], { ...config.trigger, ai: decisionAi });
		this.check = new TestCheck(this.test.checks, { ...config.check, decisionAi, reasoningAi });
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

	private readonly log = (selected: Source[], { flagged, cleared }: Result<Check>): void => {
		console.log(
			`Summary: ${selected.length} of ${this.sources.length} sources selected; ` +
				`checks: ${flagged.length} flagged, ${cleared.length} cleared`
		);
	};
}
