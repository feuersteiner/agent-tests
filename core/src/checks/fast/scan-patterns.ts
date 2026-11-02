import type { PatternMatch } from '../types.js';

/** Match every occurrence of each pattern; reject invalid regular expressions. */
export const scanPatterns = (
	patterns: string | string[] | undefined,
	content: string
): PatternMatch[] => {
	const matches: PatternMatch[] = [];
	for (const pattern of typeof patterns === 'string' ? [patterns] : (patterns ?? [])) {
		let expression: RegExp;
		try {
			expression = new RegExp(pattern, 'g');
		} catch {
			throw new Error('Invalid regular expression in a fast check.');
		}
		for (const match of content.matchAll(expression))
			if (!matches.some((item) => item.index === match.index && item.text === match[0]))
				matches.push({ text: match[0], index: match.index });
	}
	return matches.sort((left, right) => left.index - right.index);
};
