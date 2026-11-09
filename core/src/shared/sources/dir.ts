import { readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';
import { Source } from './source.ts';

/** A lazy text listing of immediate children. */
export class DirectorySource extends Source<string> {
	public readonly kind = 'directory';
	private content?: string;

	/** Cache successful text reads; failed reads can retry. */
	public readonly open = (): string => {
		return (this.content ??= [
			this.formatHeader(),
			...readdirSync(this.path).map(this.formatLine)
		].join('\n'));
	};

	private readonly formatLine = (name: string): string => {
		const path = join(this.path, name);
		const isDir = statSync(path).isDirectory();
		const kind = isDir ? 'directory' : 'file';
		const content = isDir ? undefined : readFileSync(path, 'utf-8');
		const lineCount = content
			? content.split(/\r\n|\r|\n/).length - (/[\r\n]$/.test(content) ? 1 : 0)
			: 0;

		return `\t- "${path}" of kind "${kind}"` + (isDir ? '.' : ` with line count: ${lineCount}.`);
	};

	private readonly formatHeader = (): string =>
		`Directory "${basename(this.path)}" at "${this.path}":`;
}
