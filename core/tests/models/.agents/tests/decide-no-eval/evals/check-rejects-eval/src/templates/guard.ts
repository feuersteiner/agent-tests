const FORBIDDEN = /\beval\s*\(|\bnew\s+Function\b/;

export const assertSafeTemplate = (template: string): void => {
	if (FORBIDDEN.test(template))
		throw new Error('Templates may not call eval() or new Function().');
};
