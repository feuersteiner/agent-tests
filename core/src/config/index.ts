export * from './parse.ts';
export * from './validate.ts';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseYaml } from './parse.ts';
import { validateConfig } from './validate.ts';
import type { AgentTestConfig } from './types.ts';

/** Read and validate the config in the given directory. */
export const loadConfig = (cwd: string = process.cwd()): AgentTestConfig => {
	const file = resolve(cwd, 'agent-tests.config.yaml');
	return validateConfig(parseYaml(readFileSync(file, 'utf8')));
};
