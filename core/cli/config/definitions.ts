import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parseYaml } from '../../src/config/parse.ts';
import { validateTests } from '../../src/config/validate.ts';
import type { AgentTest } from '../../src/types.ts';

/** Read and validate the immediate agent-test directories. */
export const loadDefinitions = (directory: string = '.agents/tests'): AgentTest[] =>
	validateTests(
		readdirSync(directory, { withFileTypes: true })
			.filter((entry) => entry.isDirectory())
			.map((entry) => parseYaml(readFileSync(join(directory, entry.name, 'test.yaml'), 'utf8')))
	);
