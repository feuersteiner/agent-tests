import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

/** A fresh directory under the OS temp directory, as a real path (symlinks resolved). */
export const makeTempDir = (): string => realpathSync(mkdtempSync(join(tmpdir(), 'agent-tests-')));

/** Removes the directory and everything in it; does nothing when it is already gone. */
export const removeDir = (dir: string): void => rmSync(dir, { recursive: true, force: true });

/** Writes each file, by path relative to `root`, creating its parent folders. */
export const writeFiles = (root: string, files: Record<string, string>): void => {
	for (const [path, content] of Object.entries(files)) {
		mkdirSync(dirname(join(root, path)), { recursive: true });
		writeFileSync(join(root, path), content);
	}
};

/** Runs `run` inside a fresh temp directory holding `files`, then always restores the working directory and removes the directory. */
export const inTempDir = async <T>(
	files: Record<string, string>,
	run: (dir: string) => T | Promise<T>
): Promise<T> => {
	const previous = process.cwd();
	const dir = makeTempDir();
	try {
		writeFiles(dir, files);
		process.chdir(dir);
		return await run(dir);
	} finally {
		process.chdir(previous);
		removeDir(dir);
	}
};
