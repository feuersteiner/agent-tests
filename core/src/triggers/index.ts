import type { z } from 'zod';

/** Global configuration supplied by the caller for each execution. */
export type TriggerConfig = { threshold: number };

/** Validate parameters before evaluating a boolean trigger. */
export abstract class Trigger<Params> {
	protected abstract readonly paramsSchema: z.ZodType<Params>;

	/** Require caller-owned global configuration, including for match triggers. */
	public readonly run = async (
		input: string,
		params: Params,
		config: TriggerConfig
	): Promise<boolean> => this.matches(input, this.paramsSchema.parse(params), config);

	protected abstract matches(
		input: string,
		params: Params,
		config: TriggerConfig
	): Promise<boolean>;
}
