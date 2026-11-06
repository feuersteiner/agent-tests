import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseEnv } from 'node:util';
import { AgentTestConfigSchema } from '../src/types.ts';
import type { AgentTestConfig } from '../src/types.ts';
import { git } from './git.ts';
import { parseYaml } from './yaml.ts';

/** Existing environment variables take precedence, including explicitly empty ones. */
export const loadConfig = (root: string, base?: string): AgentTestConfig => {
	try {
		try {
			const env = parseEnv(readFileSync(join(root, '.env'), 'utf8'));
			for (const [key, value] of Object.entries(env))
				if (process.env[key] === undefined) process.env[key] = value;
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
		}
		const text = base
			? git(root, ['show', `${base}:agent-tests.config.yaml`])
			: readFileSync(join(root, 'agent-tests.config.yaml'), 'utf8');
		return AgentTestConfigSchema.parse(parseYaml(text));
	} catch {
		throw new Error('Missing or invalid agent-tests.config.yaml or .env');
	}
};
