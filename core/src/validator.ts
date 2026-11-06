import type { z } from 'zod';
import { AgentTestSchema } from './types.ts';
import type { AgentTest } from './types.ts';

/** Validate test data without normalization, preserving all written key ordering. */
export class Validator {
	public readonly run = (value: unknown): AgentTest => {
		const result = AgentTestSchema.safeParse(value);
		if (!result.success) {
			const details = this.describeIssues(result.error.issues);
			throw new Error(`Invalid test definition:\n${details.join('\n')}`);
		}
		for (const entry of [...(result.data.triggers ?? []), ...result.data.checks]) {
			for (const pattern of [entry.grep ?? []].flat()) {
				try {
					new RegExp(pattern);
				} catch {
					throw new Error(`Invalid test definition: ${entry.id}.grep: invalid regular expression`);
				}
			}
		}
		return value as AgentTest;
	};

	private readonly describeIssues = (
		issues: z.core.$ZodIssue[],
		parent: PropertyKey[] = []
	): string[] => {
		return issues.flatMap((issue) => {
			const path = [...parent, ...issue.path];
			if (issue.code === 'invalid_union') {
				return issue.errors.flatMap((errors) => this.describeIssues(errors, path));
			}
			return [`${path.map(String).join('.') || 'test'}: ${issue.message}`];
		});
	};
}
