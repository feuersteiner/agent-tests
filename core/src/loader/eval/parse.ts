import type { AgentTestEval } from '../types.ts';
import { parseYaml } from '../helpers/yaml.ts';
import { validateEval } from './validate.ts';

/** Parse eval.yaml text into a validated eval, or throw its YAML problem alone, else what `validateEval` throws. */
export const parseEval = (text: string): AgentTestEval => validateEval(parseYaml(text));
