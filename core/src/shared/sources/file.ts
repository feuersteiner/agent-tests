import { readFileSync } from 'node:fs';
import { Source } from './source.ts';

/** A lazily read UTF-8 file snapshot. */
export class FileSource extends Source<string> {
	public readonly kind = 'file';
	private content?: string;

	/** Cache successful reads, including empty text; failed reads can retry. */
	public readonly open = (): string => {
		return (this.content ??= readFileSync(this.path, 'utf8'));
	};
}
