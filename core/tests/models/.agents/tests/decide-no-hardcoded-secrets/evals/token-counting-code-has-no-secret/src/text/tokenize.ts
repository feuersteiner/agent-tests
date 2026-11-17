export interface Token {
	kind: 'word' | 'number' | 'punctuation';
	text: string;
}

const TOKEN_PATTERN = /(\d+(?:\.\d+)?)|(\p{L}+)|([^\s\p{L}\d])/gu;

export const tokenize = (input: string): Token[] =>
	Array.from(input.matchAll(TOKEN_PATTERN), ([text, number, word]) => ({
		kind: number ? 'number' : word ? 'word' : 'punctuation',
		text
	}));

export const countTokens = (input: string, maxTokens = 4096): number =>
	Math.min(tokenize(input).length, maxTokens);

export const keyOf = (token: Token): string => `${token.kind}:${token.text.toLowerCase()}`;
