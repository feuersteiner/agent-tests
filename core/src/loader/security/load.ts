import type { AgentTestSecurityPolicy } from '../types.ts';
import { readFile } from '../helpers/file.ts';
import { parseSecurityPolicy } from './parse.ts';
import type { AgentTestSecurityOptions } from './validate.ts';

/** The default security policy file, relative to the current working directory. */
export const SECURITY_PATH = 'agentests.security.yaml';

/** Read a security policy file and parse it. */
export const loadSecurityPolicy = (
	path: string = SECURITY_PATH,
	options?: AgentTestSecurityOptions
): AgentTestSecurityPolicy => parseSecurityPolicy(readFile(path, `Missing ${path}`), options);
