import { AgentTestConfigSchema } from '../types.ts';
import type { AgentTestConfig } from '../types.ts';
import { describeIssues } from '../helpers/issues.ts';
import { globProblems } from '../helpers/patterns.ts';

/** Validate a parsed value as a config, or throw `path: message` lines: every schema problem; else, once the schema passes, every rule problem. */
export const validateConfig = (value: unknown): AgentTestConfig => {
	const result = AgentTestConfigSchema.safeParse(value);
	if (!result.success) throw new Error(describeIssues(result.error.issues).join('\n'));
	const problems = configProblems(result.data);
	if (problems.length) throw new Error(problems.join('\n'));
	return result.data;
};

/** Problems the schema cannot express: unsafe model URLs and leading `!` ignore globs. */
const configProblems = (config: AgentTestConfig): string[] => [
	...(['decision', 'reasoning'] as const).flatMap((field) => {
		const value = config[field].url;
		const url = new URL(value);
		const valid =
			!url.username &&
			!url.password &&
			!value.includes('?') &&
			!value.includes('#') &&
			(url.protocol === 'https:' || (url.protocol === 'http:' && url.hostname === 'localhost'));
		return valid
			? []
			: [`${field}.url: Expected HTTPS or HTTP localhost without credentials, query, or fragment`];
	}),
	...globProblems('ignore', config.ignore)
];
