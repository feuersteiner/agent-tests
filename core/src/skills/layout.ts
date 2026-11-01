import { readdir } from 'node:fs/promises';
import { basename, join, relative } from 'node:path';
import { childDirectories } from './directories.js';

/** Read a bounded repository outline without file contents or hidden credential-file names. */
export const describeLayout = async (root: string): Promise<string> => {
	const rows: string[] = [];
	const visit = async (directory: string, depth: number): Promise<void> => {
		if (rows.length >= 80 || depth > 3) return;
		const files = (await readdir(directory, { withFileTypes: true }))
			.filter((entry) => entry.isFile() && !entry.name.startsWith('.'))
			.map((entry) => join(directory, entry.name))
			.sort();
		for (const file of files) {
			if (rows.length >= 80) break;
			rows.push(relative(root, file).replaceAll('\\', '/'));
		}
		for (const child of await childDirectories(directory)) {
			if (basename(child).startsWith('.')) continue;
			if (rows.length >= 80) break;
			rows.push(`${relative(root, child).replaceAll('\\', '/')}/`);
			await visit(child, depth + 1);
		}
	};
	await visit(root, 0);
	if (rows.length >= 80) rows.push('(layout limited to 80 entries)');
	return rows.join('\n') || '(empty repository)';
};
