import { describe, expect, it, vi } from 'vitest';
import { parseYaml } from '../src/config/parse.ts';
import { validateTest } from '../src/config/validate.ts';
import { validateConfig } from '../src/config/validate.ts';
import { AgentTest } from '../src/index.ts';
import { AgentTestConfigSchema } from '../src/types.ts';
import { Source } from '../src/shared/source.ts';
import { config, yaml } from './support.ts';
const parseTest = (text: string) => validateTest(parseYaml(text));

describe('definition and configuration boundary', () => {
	it('rejects malformed YAML without exposing values', () => {
		for (const text of [
			'',
			'---\n---',
			'id: one\nid: two',
			'id: !unknown private-value',
			'id: [private-value'
		]) {
			expect(() => parseTest(text)).toThrow();
			try {
				parseTest(text);
			} catch (error) {
				expect(String(error)).not.toContain('private-value');
			}
		}
	});
	it('validates parsed objects and regexes before source reads', () => {
		const definition = parseTest(yaml);
		expect(validateTest(definition)).toEqual(definition);
		expect(() => parseTest(yaml.replace("'\\b[Gg]onna\\b'", "'['"))).toThrow('regular expression');
		expect(() => validateTest({ ...definition, unknown: true })).toThrow();
		expect(() =>
			validateTest({ ...definition, checks: [...definition.checks, ...definition.checks] })
		).toThrow('Duplicate check id');
	});
	it('requires both valid provider routes and protects credentials', () => {
		for (const url of [
			'http://example.com',
			'ftp://localhost',
			'https://user:private-value@example.com',
			'https://example.com?key=private-value'
		]) {
			expect(() => validateConfig({ ...config, decision: { ...config.decision, url } })).toThrow();
		}
		expect(
			AgentTestConfigSchema.safeParse({
				...config,
				decision: { ...config.decision, url: 'http://localhost:1234/v1' }
			}).success
		).toBe(true);
		expect(
			AgentTestConfigSchema.safeParse({ ...config, reasoning: { ...config.reasoning, api: 'jev' } })
				.success
		).toBe(false);
		vi.stubEnv('AGENT_TESTS_FIXTURE_KEY', '');
		try {
			expect(() => new AgentTest([], parseTest(yaml), config)).toThrow(
				'Missing environment variable'
			);
		} finally {
			vi.unstubAllEnvs();
		}
	});
	it('caches resolved source reads and retries failures', async () => {
		const getter = vi.fn(async () => 'snapshot');
		const source = new Source('a.md', getter);
		expect(await Promise.all([source.open(), source.open()])).toEqual(['snapshot', 'snapshot']);
		expect(await source.open()).toBe('snapshot');
		expect(getter).toHaveBeenCalledTimes(2);
		const failed = vi.fn(async (): Promise<string> => {
			throw new Error('read failed');
		});
		const broken = new Source('b.md', failed);
		await expect(broken.open()).rejects.toThrow('read failed');
		await expect(broken.open()).rejects.toThrow('read failed');
		expect(failed).toHaveBeenCalledTimes(2);
	});
});
