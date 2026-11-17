import { AgentTests } from '../../src/index.ts';
import { ENV } from './fixtures.ts';
import type { AgentTestEngine, AgentTestEngines } from '../../src/engines/types.ts';
import type { AgentTestConfig } from '../../src/loader/types.ts';

/** An engine standing in for a model engine nobody stubbed: rejects instead of reaching a model. */
const unreachable =
	(engine: 'decide' | 'reason'): AgentTestEngine =>
	async () => {
		throw new Error(`StubAgentTests: ${engine} is not stubbed and never reaches a model`);
	};

/** The real `AgentTests` built with `ENV`, with the given engines stubbed; decide and reason that are not given reject, glob and grep stay real unless given. */
export class StubAgentTests extends AgentTests {
	constructor(config: AgentTestConfig, stubs: Partial<AgentTestEngines> = {}) {
		super(config, ENV);
		Object.assign(
			this.engines,
			{ decide: unreachable('decide'), reason: unreachable('reason') },
			stubs
		);
	}
}
