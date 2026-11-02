import { parseTestDefinition } from '../parse-test-definition.js';
import { parseYaml } from './utils.js';
import type { TestDefinition } from '../types.js';

/** Parse and validate one YAML document; reject invalid input without echoing source values. */
export const parseTestYaml = (text: string): TestDefinition => parseTestDefinition(parseYaml(text));
