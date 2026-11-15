import { Source } from '.';

/** File content held in memory; the source path need not exist on disk. */
export class InMemorySource extends Source {
	public readonly kind = 'file';

	constructor(
		path: string,
		private readonly content: string
	) {
		super(path);
	}

	public readonly open = (): string => this.content;
}
