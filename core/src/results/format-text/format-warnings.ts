/** Label operational warnings in their original order. */
export const formatWarnings = (warnings: string[]): string[] =>
	warnings.map((warning) => `warning: ${warning}`);
