import {
	cpSync,
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	rmdirSync,
	writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stringify } from 'yaml';
import { loadConfig } from '../src/config/index.ts';
import type { AgentTestConfig } from '../src/config/types.ts';
import type { FileChange } from './scenarios.ts';

/** Keep the checked-in fixture intact while the demo injects failures. */
export const createWorkspace = (modelUrl: string): string => {
	const cwd = mkdtempSync(join(tmpdir(), 'agent-tests-demo-'));
	try {
		cpSync(fileURLToPath(new URL('./repository/', import.meta.url)), cwd, { recursive: true });
		const config: AgentTestConfig = loadConfig(cwd);
		config.decision.url = modelUrl;
		config.reasoning.url = modelUrl;
		writeFileSync(join(cwd, 'agent-tests.config.yaml'), stringify(config));
		return cwd;
	} catch (error: unknown) {
		rmSync(cwd, { recursive: true, force: true });
		throw error;
	}
};

/** Return cleanup that restores the file and removes newly created parent directories. */
export const changeFile = (cwd: string, change: FileChange): (() => void) => {
	const path = join(cwd, change.path);
	const original: Buffer | undefined = existsSync(path) ? readFileSync(path) : undefined;
	const parents: string[] = [];
	for (let parent = dirname(path); !existsSync(parent); parent = dirname(parent))
		parents.push(parent);
	const restore = (): void => {
		if (original !== undefined) writeFileSync(path, original);
		else rmSync(path, { force: true });
		for (const parent of parents) rmdirSync(parent);
	};
	try {
		if (change.content === null) rmSync(path);
		else {
			mkdirSync(dirname(path), { recursive: true });
			writeFileSync(path, change.content);
		}
	} catch (error: unknown) {
		restore();
		throw error;
	}
	return restore;
};
