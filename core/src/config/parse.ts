import { LineCounter, parseAllDocuments } from 'yaml';

/** Read exactly one bounded YAML document without exposing its values in errors. */
export const parseYaml = (text: string): unknown => {
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
	try {
		return document.toJS({ maxAliasCount: 100 });
	} catch {
		throw new Error('Invalid YAML: unable to resolve document aliases or keys');
	}
};
