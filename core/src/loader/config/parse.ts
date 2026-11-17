import type { AgentTestConfig } from '../types.ts';
import { parseYaml } from '../helpers/yaml.ts';
import { validateConfig } from './validate.ts';

/** Parse config text into a validated config, or throw its YAML problem alone, else what `validateConfig` throws. */
export const parseConfig = (text: string): AgentTestConfig => validateConfig(parseYaml(text));
