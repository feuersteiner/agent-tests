import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, posix } from 'node:path';
import { Source } from './base.ts';

/** A lazy text listing of immediate children, sorted by name. */
export class DirectorySource extends Source {
	public readonly kind = 'directory';
	private content?: string;

	constructor(
		path: string,
		private readonly root = '.'
	) {
		super(path);
	}

	/** Cache successful text reads; failed reads can retry. */
	public readonly open = (): string => {
		return (this.content ??= [
			this.formatHeader(),
			...readdirSync(join(this.root, this.path)).sort().map(this.formatLine)
		].join('\n'));
	};

	private readonly formatLine = (name: string): string => {
		const path = posix.join(this.path, name);
		const diskPath = join(this.root, path);
		const isDir = statSync(diskPath).isDirectory();
		const kind = isDir ? 'directory' : 'file';
		const content = isDir ? undefined : readFileSync(diskPath, 'utf-8');
		const lineCount = content
			? content.split(/\r\n|\r|\n/).length - (/[\r\n]$/.test(content) ? 1 : 0)
			: 0;

		return `\t- "${path}" of kind "${kind}"` + (isDir ? '.' : ` with line count: ${lineCount}.`);
	};

	private readonly formatHeader = (): string =>
		`Directory "${posix.basename(this.path)}" at "${this.path}":`;
}
