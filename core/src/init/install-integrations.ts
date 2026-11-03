import { createFile } from './create-file.js';
import { installHook } from './hooks.js';
import { githubWorkflow } from './templates.js';
import { installVitest } from './vitest.js';
import type { InitOptions, InitResult } from './types.js';

/** Install requested integrations; report the optional hook and preserve existing files. */
export const installIntegrations = async (
	result: InitResult,
	options: InitOptions
): Promise<void> => {
	if (options.hook) await installHook(result);
	else result.warnings.push('Optional pre-commit hook: rerun agent-tests init --hook.');
	if (options.vitest) await installVitest(result);
	if (options.github) await createFile(result, '.github/workflows/agent-tests.yml', githubWorkflow);
};
