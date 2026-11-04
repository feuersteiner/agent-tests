export class Source {
	constructor(
		public readonly path: string,
		private readonly getter: () => Promise<string>
	) {}

	public open(): Promise<string> {
		return this.getter();
	}
}
