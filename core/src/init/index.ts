import { mkdir, realpath } from 'node:fs/promises';
import { resolve } from 'node:path';
import { assertLocalPath, createFile, ignoreEnvironment } from './files.js';
import { installHook } from './hooks.js';
import { configuration, environmentExample, githubWorkflow } from './templates.js';
import { installVitest } from './vitest.js';
import type { InitOptions, InitResult } from './types.js';

/** Initialize without replacing user files; incomplete optional integrations return exit 2. */
export const initializeProject = async (
	root: string,
	options: InitOptions = {}
): Promise<InitResult> => {
	await mkdir(resolve(root), { recursive: true });
	const result: InitResult = {
		root: await realpath(resolve(root)),
		created: [],
		skipped: [],
		warnings: [],
		exitCode: 0
	};
	const tests = resolve(result.root, '.agents/tests');
	await assertLocalPath(result.root, tests);
	await mkdir(tests, { recursive: true });
	await createFile(result, 'agent-tests.config.yaml', configuration);
	await createFile(result, '.env.example', environmentExample);
	await ignoreEnvironment(result);
	if (options.hook) await installHook(result);
	else result.warnings.push('Optional pre-commit hook: rerun agent-tests init --hook.');
	if (options.vitest) await installVitest(result);
	if (options.github) await createFile(result, '.github/workflows/agent-tests.yml', githubWorkflow);
	return result;
};

export type { InitOptions, InitResult } from './types.js';
