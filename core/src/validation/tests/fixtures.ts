import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { stringify } from 'yaml';
import { parseTestYaml } from '../../schema/index.js';
import type { TestDefinition } from '../../schema/index.js';

export const referenceDefinition = async (): Promise<TestDefinition> =>
	parseTestYaml(
		await readFile(
			new URL('../../../../library/no-informal-english/test.yaml', import.meta.url),
			'utf8'
		)
	);

export const fixture = async (definition?: TestDefinition) => {
	const root = await mkdtemp(join(tmpdir(), 'agent-tests-validation-'));
	const test = definition ?? (await referenceDefinition());
	const directory = join(root, '.agents/tests', test.id);
	const source = 'A precise, independently readable test rule.\n';
	test.source = `sha256:${createHash('sha256').update(source).digest('hex')}`;
	await mkdir(directory, { recursive: true });
	await writeFile(join(directory, 'TEST.md'), source);
	await writeFile(join(directory, 'test.yaml'), stringify(test));
	return { root, directory, definition: test };
};
