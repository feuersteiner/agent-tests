import { AiRequestSchema } from '../ai/index.ts';
import type { AI } from '../ai/index.ts';
import { Trigger } from './index.ts';
import type { TriggerConfig } from './index.ts';

/** Score only the supplied content against its passing condition. */
export class ContentAskTrigger extends Trigger<string> {
	protected override readonly paramsSchema = AiRequestSchema.shape.ask;

	constructor(private readonly ai: AI) {
		super();
	}

	protected override async matches(
		input: string,
		ask: string,
		config: TriggerConfig
	): Promise<boolean> {
		return (await this.ai.run({ input, ask })) >= config.threshold;
	}
}
