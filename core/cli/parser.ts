import { LineCounter, parseAllDocuments } from 'yaml';
import type { AgentTest } from '../src/types/index.ts';
import { Validator } from '../src/validator.ts';

/** Parse one YAML document and validate its test contract; throws on invalid input. */
export class Parser {
	private readonly validator = new Validator();

	public readonly run = (text: string): AgentTest => {
		const lineCounter = new LineCounter();
		const documents = parseAllDocuments(text, {
			lineCounter,
			prettyErrors: false,
			strict: true,
			uniqueKeys: true
		});
		if (documents.length !== 1) throw new Error('Invalid YAML: expected exactly one document');
		const document = documents[0]!;
		const problem = document.errors[0] ?? document.warnings[0];
		if (problem) {
			const { line, col } = lineCounter.linePos(problem.pos[0]);
			throw new Error(`Invalid YAML at line ${line}, column ${col}: ${problem.code}`);
		}
		let value: unknown;
		try {
			value = document.toJS({ maxAliasCount: 100 });
		} catch {
			throw new Error('Invalid YAML: unable to resolve document aliases or keys');
		}
		return this.validator.run(value);
	};
}
