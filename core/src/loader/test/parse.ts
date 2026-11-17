import type { AgentTestDefinition } from '../types.ts';
import { parseYaml } from '../helpers/yaml.ts';
import { validateTest } from './validate.ts';

/** Parse test.yaml text into the latest Test shape, or throw its YAML problem alone, else what `validateTest` throws. */
export const parseTest = (text: string): AgentTestDefinition => validateTest(parseYaml(text));
