import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';

/** Read exemptions without writing configuration or accepting unknown keys. */
export const readDisabledTests = async (path: string): Promise<string[]> => {
	let content: string;
	try {
		content = await readFile(path, 'utf8');
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
		throw error;
	}
	let config: unknown;
	try {
		config = parse(content, { uniqueKeys: true });
	} catch {
		throw new Error(`Invalid tests configuration: ${path}`);
	}
	if (config === null) return [];
	if (typeof config !== 'object' || Array.isArray(config))
		throw new Error(`Invalid tests configuration: ${path}`);

	const entries = Object.entries(config);
	if (entries.some(([key]) => key !== 'disable'))
		throw new Error(`Unknown tests configuration key: ${path}`);

	const disabled = (config as { disable?: unknown }).disable ?? [];
	if (
		!Array.isArray(disabled) ||
		disabled.some((id) => typeof id !== 'string' || id.trim().length === 0)
	)
		throw new Error(`Expected disable to contain test identifiers: ${path}`);

	return [...new Set(disabled as string[])];
};
