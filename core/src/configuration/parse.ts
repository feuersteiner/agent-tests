import { parseDocument } from 'yaml';
import { z } from 'zod';
import type { AgentTestsConfig } from './types.js';

const model = z
	.object({
		provider: z.enum(['openai', 'openai-compatible']),
		model: z.string().min(1),
		apiKeyEnv: z
			.string()
			.regex(/^[A-Za-z_][A-Za-z0-9_]*$/)
			.optional(),
		baseUrl: z.string().url().optional()
	})
	.strict();
const schema = z
	.object({
		model: model.optional(),
		library: z
			.object({ repository: z.string().min(1).optional(), ref: z.string().min(1).optional() })
			.strict()
			.optional()
	})
	.strict();

/** Parse strict configuration without exposing YAML contents in errors. */
export const parseConfiguration = (text: string): AgentTestsConfig => {
	try {
		const document = parseDocument(text, { uniqueKeys: true });
		if (document.errors.length > 0) throw new Error('Invalid YAML');
		return schema.parse(document.toJS({ maxAliasCount: 0 }) ?? {});
	} catch {
		throw new Error('Invalid agent-tests.config.yaml; check its fields and YAML syntax');
	}
};
