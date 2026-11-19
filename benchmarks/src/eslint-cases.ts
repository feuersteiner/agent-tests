import ts from 'typescript';

/** One snippet of an ESLint rule test and the label ESLint's own suite gives it. */
export interface EslintCase {
	code: string;
	expect: 'pass' | 'fail';
}

/** The keys a test case may carry and still be judged by the rule's defaults alone. */
const PLAIN_KEYS = new Set(['code', 'errors', 'output', 'languageOptions']);

/** The parser settings that change how code parses, not what the rule allows. */
const PARSER_KEYS = new Set(['ecmaVersion', 'sourceType']);

const keyOf = (property: ts.ObjectLiteralElementLike): string | undefined =>
	property.name && (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name))
		? property.name.text
		: undefined;

/** The text of a plain string or a template without substitutions; undefined for anything computed. */
const textOf = (node: ts.Node): string | undefined =>
	ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) ? node.text : undefined;

/** The snippet of one `valid` or `invalid` entry, or undefined when it sets options or anything else beyond the defaults. */
const codeOf = (entry: ts.Expression): string | undefined => {
	if (!ts.isObjectLiteralExpression(entry)) return textOf(entry);
	let code: string | undefined;
	for (const property of entry.properties) {
		const key = keyOf(property);
		if (!key || !PLAIN_KEYS.has(key) || !ts.isPropertyAssignment(property)) return undefined;
		if (key === 'code') code = textOf(property.initializer);
		if (key === 'languageOptions') {
			const options = property.initializer;
			if (!ts.isObjectLiteralExpression(options)) return undefined;
			if (!options.properties.every((option) => PARSER_KEYS.has(keyOf(option) ?? '')))
				return undefined;
		}
	}
	return code;
};

/**
 * The option-free cases of an ESLint rule test file, read from its syntax tree without running it:
 * the `valid` and `invalid` lists of its `ruleTester.run(...)` call. Entries that set rule options,
 * globals, a parser or a file name are left out, so every label is the rule's default behaviour.
 */
export const extractEslintCases = (source: string): EslintCase[] => {
	const file = ts.createSourceFile(
		'rule.js',
		source,
		ts.ScriptTarget.Latest,
		true,
		ts.ScriptKind.JS
	);
	const cases: EslintCase[] = [];
	const visit = (node: ts.Node): void => {
		if (
			ts.isCallExpression(node) &&
			ts.isPropertyAccessExpression(node.expression) &&
			node.expression.name.text === 'run'
		) {
			const lists = node.arguments[2];
			if (lists && ts.isObjectLiteralExpression(lists))
				for (const property of lists.properties) {
					const key = keyOf(property);
					if (key !== 'valid' && key !== 'invalid') continue;
					if (!ts.isPropertyAssignment(property)) continue;
					if (!ts.isArrayLiteralExpression(property.initializer)) continue;
					for (const entry of property.initializer.elements) {
						const code = codeOf(entry);
						if (code !== undefined) cases.push({ code, expect: key === 'valid' ? 'pass' : 'fail' });
					}
				}
		}
		ts.forEachChild(node, visit);
	};
	visit(file);
	return cases;
};
