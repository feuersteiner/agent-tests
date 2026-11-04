import { LineCounter, parseAllDocuments } from 'yaml';
import type { z } from 'zod';
import { AgentTestSchema } from '../types/index.ts';
import type { AgentTest } from '../types/index.ts';

const describeIssues = (issues: z.core.$ZodIssue[], parent: PropertyKey[] = []): string[] =>
	issues.flatMap((issue) => {
		const path = [...parent, ...issue.path];
		if (issue.code === 'invalid_union') {
			return issue.errors.flatMap((errors) => describeIssues(errors, path));
		}
		return [`${path.map(String).join('.') || 'test'}: ${issue.message}`];
	});

/** Validate test data without normalization, preserving all written key ordering. */
export const parseTestDefinition = (value: unknown): AgentTest => {
	const result = AgentTestSchema.safeParse(value);
	if (!result.success) {
		const details = describeIssues(result.error.issues);
		throw new Error(`Invalid test definition:\n${details.join('\n')}`);
	}
	return value as AgentTest;
};

/** Parse one YAML document and validate its test contract; throws on invalid input. */
export const parseTestYaml = (text: string): AgentTest => {
	const lineCounter = new LineCounter();
	const documents = parseAllDocuments(text, {
		lineCounter,
		prettyErrors: false,
		strict: true,
		uniqueKeys: true
	});
	if (documents.length !== 1) throw new Error('Invalid YAML: expected exactly one document');
	const document = documents[0]!;
	const problem = document.errors[0] ?? document.warnings[0];
	if (problem) {
		const { line, col } = lineCounter.linePos(problem.pos[0]);
		throw new Error(`Invalid YAML at line ${line}, column ${col}: ${problem.code}`);
	}
	let value: unknown;
	try {
		value = document.toJS({ maxAliasCount: 100 });
	} catch {
		throw new Error('Invalid YAML: unable to resolve document aliases or keys');
	}
	return parseTestDefinition(value);
};
