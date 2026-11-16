import type { AgentTestDefinition } from '../types.ts';
import { parseYaml } from '../helpers/yaml.ts';
import { validateTest } from './validate.ts';

/** Parse test.yaml text into the latest Test shape, or throw every problem as `path: message` lines. */
export const parseTest = (text: string): AgentTestDefinition => validateTest(parseYaml(text));
