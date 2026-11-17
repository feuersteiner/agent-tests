// Small per-line highlighting for the editor. Joining a line's token texts gives the line back.
export type TokenKind =
	| 'plain'
	| 'comment'
	| 'string'
	| 'key'
	| 'keyword'
	| 'number'
	| 'function'
	| 'heading'
	| 'strong'
	| 'punctuation';
export interface Token {
	text: string;
	kind: TokenKind;
}
export type Language = 'yaml' | 'markdown' | 'typescript' | 'plain';

// Strings may stay open to the end of the line, so half-typed text is already colored.
const grammars: Record<Language, RegExp | undefined> = {
	yaml: new RegExp(
		[
			String.raw`(?<comment>(?<=^|\s)#.*)`,
			String.raw`(?<string>(?<=^|[\s:\[,])(?:"(?:[^"\\]|\\.)*(?:"|$)|'(?:[^']|'')*(?:'|$)))`,
			String.raw`(?<key>(?<=^\s*(?:-\s+)?)[\w"'./-]+(?=\s*:(?:\s|$)))`,
			String.raw`(?<keyword>\b(?:true|false|null)\b)`,
			String.raw`(?<number>(?<![\w.-])-?\d+(?:\.\d+)?(?![\w.-]))`,
			String.raw`(?<punctuation>^\s*-(?=\s|$)|(?<=:\s*)[|>][+-]?$)`
		].join('|'),
		'g'
	),
	markdown: new RegExp(
		[
			String.raw`(?<punctuation>^\s*\x60\x60\x60.*|^\s*(?:[-*+]|\d+\.)(?=\s))`,
			String.raw`(?<heading>^#{1,6}\s.*)`,
			String.raw`(?<comment><!--.*?(?:-->|$))`,
			String.raw`(?<string>\x60[^\x60]*(?:\x60|$))`,
			String.raw`(?<strong>\*\*[^*]+(?:\*\*|$))`
		].join('|'),
		'g'
	),
	typescript: new RegExp(
		[
			String.raw`(?<comment>\/\/.*|\/\*.*?(?:\*\/|$))`,
			String.raw`(?<string>'(?:[^'\\]|\\.)*(?:'|$)|"(?:[^"\\]|\\.)*(?:"|$)|\x60(?:[^\x60\\]|\\.)*(?:\x60|$))`,
			String.raw`(?<keyword>\b(?:import|from|export|default|const|let|var|function|return|if|else|for|of|in|await|async|new|type|interface|as|extends|class|true|false|null|undefined|this|typeof)\b)`,
			String.raw`(?<number>\b\d+(?:\.\d+)?\b)`,
			String.raw`(?<function>[A-Za-z_$][\w$]*(?=\())`
		].join('|'),
		'g'
	),
	plain: undefined
};

/** Picks the grammar from a file name's extension. */
export const languageOf = (file: string): Language => {
	const extension = file.split('.').pop()?.toLowerCase() ?? '';
	if (['yaml', 'yml'].includes(extension)) return 'yaml';
	if (['md', 'markdown'].includes(extension)) return 'markdown';
	if (['ts', 'js', 'mjs', 'cjs', 'mts', 'cts', 'tsx', 'jsx'].includes(extension))
		return 'typescript';
	return 'plain';
};

/** Splits one line of code into colored tokens. */
export const tokenize = (line: string, language: Language): Token[] => {
	const grammar = grammars[language];
	if (!grammar) return line ? [{ text: line, kind: 'plain' }] : [];
	const tokens: Token[] = [];
	let cursor = 0;
	for (const match of line.matchAll(grammar)) {
		if (!match[0]) continue;
		if (match.index > cursor) tokens.push({ text: line.slice(cursor, match.index), kind: 'plain' });
		const kind = Object.entries(match.groups ?? {}).find(([, value]) => value !== undefined)?.[0];
		tokens.push({ text: match[0], kind: (kind as TokenKind | undefined) ?? 'plain' });
		cursor = match.index + match[0].length;
	}
	if (cursor < line.length) tokens.push({ text: line.slice(cursor), kind: 'plain' });
	return tokens;
};
