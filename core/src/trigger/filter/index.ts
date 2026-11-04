import type { z } from 'zod';

/** Global configuration supplied by the caller for each execution. */
export type FilterConfig = { threshold: number };

/** Validate parameters before evaluating a boolean filter. */
export abstract class Filter<Params> {
	protected abstract readonly paramsSchema: z.ZodType<Params>;

	/** Require caller-owned global configuration, including for match filters. */
	public readonly run = async (
		input: string,
		params: Params,
		config: FilterConfig
	): Promise<boolean> => this.matches(input, this.paramsSchema.parse(params), config);

	protected abstract matches(input: string, params: Params, config: FilterConfig): Promise<boolean>;
}
