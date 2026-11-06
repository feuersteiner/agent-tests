/** A lazily read source snapshot shared by triggers, checks, and explanations. */
export class Source {
	private content?: string;

	constructor(
		public readonly path: string,
		private readonly getter: () => Promise<string>
	) {}

	/** Cache resolved content; concurrent reads may repeat and failed reads can retry. */
	public readonly open = async (): Promise<string> => {
		return (this.content ??= await this.getter());
	};
}
