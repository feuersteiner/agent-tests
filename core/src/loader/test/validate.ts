import { AgentTestSchema } from '../../types.ts';
import type { AgentTest } from '../../types.ts';
import { describeIssues } from '../helpers/issues.ts';
import { globProblems, patterns } from '../helpers/patterns.ts';

/** The newest test.yaml format version this package validates. */
export const LATEST_VERSION = 1;

/** Validate a parsed value as the latest Test shape, or throw every schema and rule problem as `path: message` lines. */
export const validateTest = (value: unknown): AgentTest => {
	const version =
		typeof value === 'object' && value !== null && 'version' in value ? value.version : undefined;
	if (typeof version !== 'number' || !Number.isInteger(version))
		throw new Error(`version: Required as an integer, e.g. \`version: ${LATEST_VERSION}\``);
	if (version > LATEST_VERSION)
		throw new Error(
			`version: ${version} is newer than this package supports (${LATEST_VERSION}); upgrade agent-tests`
		);
	const result = AgentTestSchema.safeParse(value);
	if (!result.success) throw new Error(describeIssues(result.error.issues).join('\n'));
	const problems = testProblems(result.data);
	if (problems.length) throw new Error(problems.join('\n'));
	return result.data;
};

/** Problems the schema cannot express: duplicate test ids, invalid regexes, leading `!` globs. */
const testProblems = (test: AgentTest): string[] => {
	const ids = new Set<string>();
	const greps = [
		...patterns('select.grep', test.select?.grep),
		...test.test.flatMap((entry, index) => patterns(`test.${index}.grep`, entry.grep))
	];
	return [
		...test.test.flatMap(({ id }, index) => {
			const duplicate = ids.has(id);
			ids.add(id);
			return duplicate ? [`test.${index}.id: Duplicate test id`] : [];
		}),
		...greps.flatMap(([path, pattern]) =>
			compiles(pattern) ? [] : [`${path}: Invalid regular expression`]
		),
		...globProblems('select.glob', test.select?.glob)
	];
};

const compiles = (pattern: string): boolean => {
	try {
		new RegExp(pattern);
		return true;
	} catch {
		return false;
	}
};
