import { Source } from './source.ts';

/** File content held in memory; the source path need not exist on disk. */
export class InMemorySource extends Source<string> {
	public readonly kind = 'file';

	constructor(
		path: string,
		private readonly content: string
	) {
		super(path);
	}

	public readonly open = (): string => this.content;
}
