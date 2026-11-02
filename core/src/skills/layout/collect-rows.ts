import { readdir } from 'node:fs/promises';
import { basename, dirname, join, relative } from 'node:path';

/**
 * @param root Canonical outline root used for relative display paths.
 * @param directory Current real directory.
 * @param depth Current depth; file listing stops beyond depth three.
 * @param directories Real directories from discovery's shared exclusion policy.
 * @param rows Shared output buffer, capped at 80 entries.
 * @returns The same buffer with visible files and directories in deterministic depth-first order.
 * @throws For unreadable directory contents.
 */
export const collectRows = async (
	root: string,
	directory: string,
	depth: number,
	directories: string[],
	rows: string[]
): Promise<string[]> => {
	if (rows.length >= 80 || depth > 3) return rows;
	const files = (await readdir(directory, { withFileTypes: true }))
		.filter((entry) => entry.isFile() && !entry.name.startsWith('.'))
		.map((entry) => join(directory, entry.name))
		.sort();
	for (const file of files) {
		if (rows.length >= 80) break;
		rows.push(relative(root, file).replaceAll('\\', '/'));
	}
	for (const child of directories
		.filter((child) => child !== directory && dirname(child) === directory)
		.sort()) {
		if (basename(child).startsWith('.')) continue;
		if (rows.length >= 80) break;
		rows.push(`${relative(root, child).replaceAll('\\', '/')}/`);
		await collectRows(root, child, depth + 1, directories, rows);
	}
	return rows;
};
