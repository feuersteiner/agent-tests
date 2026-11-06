import type { AgentTest } from '../src/types.ts';
import { Validator } from '../src/validator.ts';
import { parseYaml } from './yaml.ts';

/** Parse one YAML document and validate its test contract; throws on invalid input. */
export class Parser {
	private readonly validator = new Validator();

	public readonly run = (text: string): AgentTest => {
		return this.validator.run(parseYaml(text));
	};
}
