import { execFileSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { IdSchema } from '../../src/shared/types.ts';
import { parseYaml } from '../../src/config/parse.ts';
import { validateTest } from '../../src/config/validate.ts';

export const repository = 'feuersteiner/agent-tests';
export const digest = (text: string): string => createHash('sha256').update(text).digest('hex');
export type CatalogTest = { id: string; commit: string; prose: string; yaml: string };

/** Read a pinned, bare Git catalog; never check out or execute community code. */
export class Catalog {
	private constructor(
		private readonly directory: string,
		public readonly commit: string
	) {}

	public static readonly open = async (
		remote = `https://github.com/${repository}.git`
	): Promise<Catalog> => {
		const directory = await mkdtemp(join(tmpdir(), 'agent-tests-catalog-'));
		try {
			execFileSync(
				'git',
				[
					'clone',
					'--quiet',
					'--bare',
					'--depth=1',
					'--single-branch',
					'--branch',
					'main',
					'--',
					remote,
					directory
				],
				{ stdio: 'pipe' }
			);
			return new Catalog(
				directory,
				execFileSync('git', ['--git-dir', directory, 'rev-parse', 'HEAD'], {
					encoding: 'utf8'
				}).trim()
			);
		} catch {
			await rm(directory, { recursive: true, force: true });
			throw new Error('Unable to read community catalog');
		}
	};

	private readonly read = (path: string): string =>
		execFileSync('git', ['--git-dir', this.directory, 'show', `${this.commit}:${path}`], {
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'pipe']
		});

	public readonly get = (id: string): CatalogTest | undefined => {
		IdSchema.parse(id);
		let prose: string, yaml: string;
		try {
			prose = this.read(`library/${id}/TEST.md`);
			yaml = this.read(`library/${id}/test.yaml`);
		} catch {
			return undefined;
		}
		const test = validateTest(parseYaml(yaml));
		if (test.id !== id || test.source !== `sha256:${digest(prose)}`)
			throw new Error('Invalid community source digest or id');
		if (
			!['pass', 'fail', 'skip'].every((label) =>
				test.evals.some((example) => example.expect === label)
			)
		)
			throw new Error('Community test needs pass, fail, and skip evals');
		return { id, commit: this.commit, prose, yaml };
	};

	public readonly list = (): string[] =>
		execFileSync(
			'git',
			['--git-dir', this.directory, 'ls-tree', '--name-only', `${this.commit}:library`],
			{ encoding: 'utf8' }
		)
			.split('\n')
			.filter((id) => IdSchema.safeParse(id).success && this.get(id) !== undefined);
	public readonly close = (): Promise<void> => rm(this.directory, { recursive: true, force: true });
}
