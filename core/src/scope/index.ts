import { execFileSync } from 'node:child_process';
import { lstatSync } from 'node:fs';
import { posix } from 'node:path';
import { Minimatch } from 'minimatch';
import { DirectorySource, FileSource } from '../sources/index.ts';
import type { Source } from '../sources/index.ts';
import type { AgentTestScopeTarget } from './types.ts';

/** Changed paths below the working directory and relative to it, without deletions. */
const DIFF = ['diff', '--name-only', '-z', '--relative', '--diff-filter=d'];

/** Untracked paths below the working directory and relative to it, without Git-ignored ones. */
const UNTRACKED = ['ls-files', '--others', '--exclude-standard', '-z'];

/** How `ignore` globs match: dotfiles included, forward slashes only. */
const IGNORE_OPTIONS = { dot: true, platform: 'linux' } as const;

/** Builds the list of sources a run looks at. */
export class AgentTestScope {
	constructor(
		private readonly ignore: string[],
		private readonly target: AgentTestScopeTarget
	) {}

	/** Every file Git lists for the target that counts, and its ancestor directories, sorted by path. */
	public readonly run = (): Source[] => {
		console.log(`Scoping ${this.target.kind} sources`);
		const globs = this.ignore.map((pattern) => new Minimatch(pattern, IGNORE_OPTIONS));
		const files = new Set(this.listFiles().filter((path) => this.isKept(path, globs)));
		const paths = [...new Set([...files].flatMap(this.withAncestors))].sort();
		const sources = paths.map((path) =>
			files.has(path) ? new FileSource(path) : new DirectorySource(path)
		);
		console.log(`${sources.length} source(s) in scope`);
		return sources;
	};

	/** The file paths Git lists for the target. */
	private readonly listFiles = (): string[] => {
		if (this.target.kind === 'all') return this.git([...UNTRACKED, '--cached']);
		if (this.target.kind === 'staged') return this.git([...DIFF, '--cached']);
		if (this.target.kind === 'base')
			return this.git([...DIFF, '--end-of-options', `${this.target.ref}...HEAD`, '--']);
		return [...this.git([...DIFF, 'HEAD']), ...this.git(UNTRACKED)];
	};

	/** The NUL-separated paths a Git command prints; its stderr goes into the thrown error. */
	private readonly git = (args: string[]): string[] =>
		execFileSync('git', args, { encoding: 'utf8', stdio: 'pipe', maxBuffer: 256 * 1024 * 1024 })
			.split('\0')
			.filter((path) => path !== '');

	/** Kept when no `ignore` glob excludes it and it is a regular file on disk right now. */
	private readonly isKept = (path: string, globs: Minimatch[]): boolean =>
		!this.isIgnored(path, globs) && lstatSync(path, { throwIfNoEntry: false })?.isFile() === true;

	/** Ignored when a glob matches the file or an ancestor directory, a directory also with a trailing slash. */
	private readonly isIgnored = (path: string, globs: Minimatch[]): boolean =>
		this.withAncestors(path).some((candidate) =>
			globs.some(
				(glob) => glob.match(candidate) || (candidate !== path && glob.match(`${candidate}/`))
			)
		);

	/** The path and each ancestor directory of it, without the working directory itself. */
	private readonly withAncestors = (path: string): string[] => {
		const parent = posix.dirname(path);
		return parent === '.' ? [path] : [path, ...this.withAncestors(parent)];
	};
}
