import type { AgentTestSecurityPolicy } from '../types.ts';
import { parseYaml } from '../helpers/yaml.ts';
import { validateSecurityPolicy } from './validate.ts';
import type { AgentTestSecurityOptions } from './validate.ts';

/** Parse policy text into a validated security policy, or throw its YAML problem alone, else what `validateSecurityPolicy` throws. */
export const parseSecurityPolicy = (
	text: string,
	options?: AgentTestSecurityOptions
): AgentTestSecurityPolicy => validateSecurityPolicy(parseYaml(text), options);
