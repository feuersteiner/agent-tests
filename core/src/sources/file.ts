import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Source } from './base.ts';

/** A lazily read UTF-8 file snapshot. */
export class FileSource extends Source {
	public readonly kind = 'file';
	private content?: string;

	constructor(
		path: string,
		private readonly root = '.'
	) {
		super(path);
	}

	/** Cache successful reads, including empty text; failed reads can retry. */
	public readonly open = (): string => {
		return (this.content ??= readFileSync(join(this.root, this.path), 'utf8'));
	};
}
