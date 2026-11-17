import { stringify } from 'yaml';
import { CONFIG_PATH, EVAL_FILE } from '../../src/loader/index.ts';
import { AgentTestConfigSchema } from '../../src/loader/types.ts';
import type { AgentTestEnv } from '../../src/engines/types.ts';
import type { AgentTestOutcome } from '../../src/eval/types.ts';
import type { AgentTestConfig, AgentTestDefinition } from '../../src/loader/types.ts';

/** Fake values for the two key variables `validConfig` names; never a real key. */
export const ENV: AgentTestEnv = {
	DECISION_KEY: 'fake-decision-key',
	REASONING_KEY: 'fake-reasoning-key'
};

/** A complete config with unreachable model URLs, thresholds of 0.5, and the loader's default `ignore`. */
export const validConfig = (overrides: Partial<AgentTestConfig> = {}): AgentTestConfig => ({
	ignore: AgentTestConfigSchema.shape.ignore.parse(undefined),
	decision: {
		api: 'openai',
		url: 'https://decision.invalid/v1',
		model: 'test-decision',
		apiKeyEnv: 'DECISION_KEY'
	},
	reasoning: {
		api: 'openai',
		url: 'https://reasoning.invalid/v1',
		model: 'test-reasoning',
		apiKeyEnv: 'REASONING_KEY'
	},
	select: { threshold: 0.5 },
	assert: { threshold: 0.5 },
	...overrides
});

/** The Test `no-todo`: selects the TypeScript files under `src/` and fails each one holding TODO. */
export const validTest = (overrides: Partial<AgentTestDefinition> = {}): AgentTestDefinition => ({
	version: 1,
	id: 'no-todo',
	title: 'No TODO',
	description: 'Source files hold no TODO comments.',
	select: { glob: 'src/**/*.ts' },
	assert: [
		{
			id: 'no-todo',
			description: 'The file holds no TODO.',
			error: 'Remove the TODO.',
			grep: 'TODO'
		}
	],
	...overrides
});

/** The value as YAML text. */
export const toYaml = (value: unknown): string => stringify(value);

/** The file map holding `agentests.config.yaml` for `validConfig(overrides)`. */
export const configFile = (overrides: Partial<AgentTestConfig> = {}): Record<string, string> => ({
	[CONFIG_PATH]: toYaml(validConfig(overrides))
});

/** The file map of `.agents/tests/<id>/`: `test.yaml`, `TEST.md` when `rule` is given, and each eval's `eval.yaml` and files. */
export const testFolder = (
	test: AgentTestDefinition,
	evals: Record<string, { expect: AgentTestOutcome; files: Record<string, string> }> = {},
	rule?: string
): Record<string, string> => {
	const folder = `.agents/tests/${test.id}`;
	const files: Record<string, string> = { [`${folder}/test.yaml`]: toYaml(test) };
	if (rule !== undefined) files[`${folder}/TEST.md`] = rule;
	for (const [id, { expect, files: evalFiles }] of Object.entries(evals)) {
		files[`${folder}/evals/${id}/${EVAL_FILE}`] = toYaml({ expect });
		for (const [path, content] of Object.entries(evalFiles))
			files[`${folder}/evals/${id}/${path}`] = content;
	}
	return files;
};
