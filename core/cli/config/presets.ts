import type { AgentTestDecisionConfig, AgentTestReasoningConfig } from '../../src/engines/types.ts';
import type { AgentTestConfig } from '../../src/loader/types.ts';

/** A provider the config's `decision` section accepts. */
type DecisionProvider = AgentTestDecisionConfig['api'];

/** A provider the config's `reasoning` section accepts. */
type ReasoningProvider = AgentTestReasoningConfig['api'];

/** The config `init` writes: every section but `ignore`, which the schema defaults. */
export type InitConfig = Omit<AgentTestConfig, 'ignore'>;

/** The `select` and `assert` threshold the written config starts with. */
const THRESHOLD = 0.5;

/** The `decision` section for each provider. */
const DECISION_PRESETS: Record<DecisionProvider, AgentTestDecisionConfig> = {
	openai: {
		api: 'openai',
		url: 'https://api.openai.com/v1',
		model: 'gpt-6-luna',
		apiKeyEnv: 'OPENAI_API_KEY'
	},
	jev: {
		api: 'jev',
		url: 'https://api.typesafe.ai/v1',
		model: 'jev-latest',
		apiKeyEnv: 'TYPESAFE_AI_API_KEY'
	}
};

/** The `reasoning` section for each provider. */
const REASONING_PRESETS: Record<ReasoningProvider, AgentTestReasoningConfig> = {
	openai: {
		api: 'openai',
		url: 'https://api.openai.com/v1',
		model: 'gpt-6-sol',
		apiKeyEnv: 'OPENAI_API_KEY'
	},
	anthropic: {
		api: 'anthropic',
		url: 'https://api.anthropic.com/v1',
		model: 'claude-sonnet-5-5',
		apiKeyEnv: 'ANTHROPIC_API_KEY'
	}
};

/** The providers there is a `decision` preset for. */
export const DECISION_PROVIDERS = Object.keys(DECISION_PRESETS) as DecisionProvider[];

/** The providers there is a `reasoning` preset for. */
export const REASONING_PROVIDERS = Object.keys(REASONING_PRESETS) as ReasoningProvider[];

/** The config built from the chosen providers' presets, with the starting thresholds. */
export const toConfig = (decision: DecisionProvider, reasoning: ReasoningProvider): InitConfig => ({
	decision: DECISION_PRESETS[decision],
	reasoning: REASONING_PRESETS[reasoning],
	select: { threshold: THRESHOLD },
	assert: { threshold: THRESHOLD }
});
