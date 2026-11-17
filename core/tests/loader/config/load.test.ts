import { describe, expect, test } from 'bun:test';
import { loadConfig } from '../../../src/loader/index.ts';
import { configFile, toYaml, validConfig } from '../../helpers/fixtures.ts';
import { inTempDir } from '../../helpers/temp.ts';

describe('loadConfig', () => {
	test('loads agentests.config.yaml from the working directory', async () => {
		const config = validConfig({ ignore: ['dist/**'], select: { threshold: 0.25 } });
		await inTempDir(configFile(config), () => {
			expect(loadConfig()).toEqual(config);
		});
	});

	test('validates the file it loads', async () => {
		const files = { 'agentests.config.yaml': toYaml({ ...validConfig(), extra: true }) };
		await inTempDir(files, () => {
			expect(() => loadConfig()).toThrow('extra: Unknown field');
		});
	});

	test('a missing file throws a message pointing to agentests init', async () => {
		await inTempDir({}, () => {
			expect(() => loadConfig()).toThrow('Missing agentests.config.yaml; run `agentests init`');
		});
	});
});
