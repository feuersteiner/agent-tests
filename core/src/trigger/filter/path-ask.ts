import { AiRequestSchema } from '../../shared/ai/index.ts';
import type { AI } from '../../shared/ai/index.ts';
import { Filter } from './index.ts';
import type { FilterConfig } from './index.ts';

/** Score only the supplied path against its passing condition. */
export class PathAskFilter extends Filter<string> {
	protected override readonly paramsSchema = AiRequestSchema.shape.ask;

	constructor(private readonly ai: AI) {
		super();
	}

	protected override async matches(
		input: string,
		ask: string,
		config: FilterConfig
	): Promise<boolean> {
		return (await this.ai.run({ input, ask })) >= config.threshold;
	}
}
