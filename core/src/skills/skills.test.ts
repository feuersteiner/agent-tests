import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { compileTest, listSkills, readSkill } from './index.js';

const roots: string[] = [];

const fixture = async (): Promise<string> => {
	const root = await mkdtemp(join(tmpdir(), 'agent-tests-skills-'));
	roots.push(root);
	return root;
};

const installSource = async (
	root: string,
	source = 'Customer prose is formal.\n'
): Promise<string> => {
	const directory = join(root, '.agents/tests/no-informal-english');
	await mkdir(directory, { recursive: true });
	await writeFile(join(directory, 'TEST.md'), source);
	return directory;
};

afterEach(async () => {
	await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('bundled generator skill', () => {
	it('lists skills without exposing mutable catalog state', () => {
		const skills = listSkills();
		expect(skills).toEqual([
			{
				name: 'test-generator',
				description: 'Compile TEST.md and iterate on validation and labeled evaluations.'
			}
		]);
		skills[0]!.name = 'changed';
		expect(listSkills()[0]!.name).toBe('test-generator');
	});

	it('provides schema, exact hashes and truthful validation loops', () => {
		const skill = readSkill('test-generator');
		for (const term of [
			'source',
			'triggers',
			'fast',
			'smart',
			'deep',
			'expect',
			'validate',
			'eval'
		])
			expect(skill).toContain(term);
		expect(skill).toContain('one backslash');
		expect(skill).toContain("'\\bword\\b'");
		expect(skill).toContain('Never claim model-dependent behavior is verified by a skip');
	});

	it('rejects arbitrary file paths as skill names', () => {
		expect(() => readSkill('../../secrets')).toThrow('Unknown skill');
	});
});

describe('compilation brief', () => {
	it('reads the reference rule without requiring or writing compiled output', async () => {
		const root = await fixture();
		const text = await readFile(
			new URL('../../../library/no-informal-english/TEST.md', import.meta.url),
			'utf8'
		);
		const directory = await installSource(root, text);
		await mkdir(join(root, 'src/help'), { recursive: true });
		await writeFile(join(root, 'src/help/welcome.md'), 'Welcome.');
		const brief = await compileTest(root, 'no-informal-english');
		expect(brief).toContain(text);
		expect(brief).toContain(`sha256:${createHash('sha256').update(text).digest('hex')}`);
		expect(brief).toContain('.agents/tests/no-informal-english/test.yaml');
		expect(brief).toContain('src/help/welcome.md');
		expect(brief).toContain('npx --no -- agent-tests validate no-informal-english');
		expect(brief).toContain('npx --no -- agent-tests eval no-informal-english');
		expect(await readdir(directory)).toEqual(['TEST.md']);
		expect(await readFile(join(directory, 'TEST.md'), 'utf8')).toBe(text);
	});

	it('omits dependency trees and credential-file names from the layout', async () => {
		const root = await fixture();
		await installSource(root);
		await mkdir(join(root, 'node_modules/private'), { recursive: true });
		await writeFile(join(root, 'node_modules/private/password.txt'), 'secret');
		await writeFile(join(root, '.env'), 'SECRET=value');
		const brief = await compileTest(root, 'no-informal-english');
		expect(brief).not.toContain('password.txt');
		expect(brief).not.toContain('SECRET=value');
		expect(brief).not.toContain('\n.env');
	});

	it('rejects unsafe ids and missing source', async () => {
		const root = await fixture();
		for (const id of ['../escape', 'wrong/id', '', '--help'])
			await expect(compileTest(root, id)).rejects.toThrow('Invalid test id');
		await expect(compileTest(root, 'missing')).rejects.toThrow('No installed TEST.md');
	});

	it('rejects ambiguous nested packages instead of compiling the wrong rule', async () => {
		const root = await fixture();
		await installSource(root);
		await installSource(join(root, 'packages/web'));
		await expect(compileTest(root, 'no-informal-english')).rejects.toThrow('ambiguous');
	});

	it('refuses symbolic source files outside the repository', async () => {
		const root = await fixture();
		const outside = await fixture();
		const directory = await installSource(root);
		await writeFile(join(outside, 'private.md'), 'Outside prose');
		await rm(join(directory, 'TEST.md'));
		await symlink(join(outside, 'private.md'), join(directory, 'TEST.md'));
		await expect(compileTest(root, 'no-informal-english')).rejects.toThrow('regular file');
	});
});
