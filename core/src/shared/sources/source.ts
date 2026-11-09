/** Lazily opened content with a readonly path and source kind. */
export abstract class Source<Content = string> {
	public abstract readonly kind: string;

	constructor(public readonly path: string) {}

	public abstract readonly open: () => Content;
}
