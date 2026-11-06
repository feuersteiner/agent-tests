/** A lazily read source snapshot shared by triggers, checks, and explanations. */
export class Source {
	private content?: Promise<string>;

	constructor(
		public readonly path: string,
		private readonly getter: () => Promise<string>
	) {}

	/** Read once, including failures, so every stage inspects the same content. */
	public readonly open = (): Promise<string> => {
		this.content ??= Promise.resolve().then(this.getter);
		return this.content;
	};
}
