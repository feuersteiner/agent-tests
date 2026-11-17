/** Lazily opened content with a readonly path and source kind. */
export abstract class Source {
	public abstract readonly kind: 'file' | 'directory';

	constructor(public readonly path: string) {}

	public abstract readonly open: () => string;
}
