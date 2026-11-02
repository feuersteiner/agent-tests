/** Rejects backreferences and nested variable repetition without executing the expression. */
export const isRiskyPattern = (value: string): boolean => {
	if (/\\[1-9]/.test(value)) return true;
	const syntax = value
		.replace(/\\.|\[(?:\\.|[^\]\\])*\]/g, '.')
		.replace(/\{(\d+),(\d*)\}/g, (quantifier, minimum: string, maximum: string) =>
			maximum === '' || Number(minimum) !== Number(maximum) ? '+' : quantifier
		);
	return /\([^)]*[+*][^)]*\)[+*{]/.test(syntax);
};
