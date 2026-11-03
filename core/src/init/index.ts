import { createDirectories } from './create-directories.js';
import { createFile } from './create-file.js';
import { ignoreEnvironment } from './ignore-environment.js';
import { installIntegrations } from './install-integrations.js';
import { prepareInitialization } from './prepare-initialization.js';
import { configuration, environmentExample } from './templates.js';
import type { InitOptions, InitResult } from './types.js';

/** Initialize without replacing user files; incomplete optional integrations return exit 2. */
export const initializeProject = async (
	root: string,
	options: InitOptions = {}
): Promise<InitResult> => {
	const result = prepareInitialization(root);
	await createDirectories(result);
	await createFile(result, 'agent-tests.config.yaml', configuration);
	await createFile(result, '.env.example', environmentExample);
	await ignoreEnvironment(result);
	await installIntegrations(result, options);
	return result;
};

export type { InitOptions, InitResult } from './types.js';
