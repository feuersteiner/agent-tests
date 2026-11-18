import { randomUUID } from 'node:crypto';
import type { AgentTestSecurityPolicy } from '../loader/types.ts';
import { countEvents, expandHeaders, expandValue, send } from './http.ts';
import type { ProbeResponse } from './http.ts';
import { scenarioPrompt } from './scenarios.ts';
import type {
	AgentTestSecurityEvidence,
	AgentTestSecurityReport,
	AgentTestSecurityResult,
	AgentTestSecurityTest,
	AgentTestSignal
} from './types.ts';
import { sleep } from './utils.ts';
import { judge } from './verdict.ts';

/** Seams for tests and callers: the HTTP client, the clock, and a callback after each Test. */
export interface ProbeOptions {
	fetch?: typeof fetch;
	now?: () => number;
	sleep?: (ms: number) => Promise<void>;
	runId?: string;
	onResult?: (result: AgentTestSecurityResult) => void;
}

/** Headers sent on every request, so the target's logs can tell test traffic apart. */
export const RUN_HEADER = 'x-agentests-run';
export const TEST_HEADER = 'x-agentests-test';

/** Whether a response is the signal: one of its statuses and, when set, a body matching its case-insensitive regex. */
const matches = ({ status, body }: AgentTestSignal, response: ProbeResponse): boolean =>
	status.includes(response.status) &&
	(body === undefined || new RegExp(body, 'i').test(response.body));

/**
 * Runs a validated security policy against its target: each Test sends its scenario one request at a time,
 * spread over `duration_seconds`, never more than `safety.max_requests` in the whole run, then judges the evidence.
 * Built once per policy from the policy and an environment map for `${VAR}` references, never the process environment.
 */
export class ProbeOrchestrator {
	readonly #policy: AgentTestSecurityPolicy;
	readonly #env: Record<string, string | undefined>;
	readonly #fetch: typeof fetch;
	readonly #now: () => number;
	readonly #sleep: (ms: number) => Promise<void>;
	readonly #runId: string;
	readonly #onResult?: (result: AgentTestSecurityResult) => void;
	#budget = 0;

	constructor(
		policy: AgentTestSecurityPolicy,
		env: Record<string, string | undefined>,
		options: ProbeOptions = {}
	) {
		this.#policy = policy;
		this.#env = env;
		this.#fetch = options.fetch ?? fetch;
		this.#now = options.now ?? Date.now;
		this.#sleep = options.sleep ?? sleep;
		this.#runId = options.runId ?? randomUUID();
		this.#onResult = options.onResult;
	}

	/** Run every Test in policy order, or only the one with `id`; throws on an unknown id or an unreachable target. */
	readonly run = async (id?: string): Promise<AgentTestSecurityReport> => {
		const { name, target, tests } = this.#policy;
		const selected = id === undefined ? tests : tests.filter((test) => test.id === id);
		if (!selected.length) throw new Error(`Unknown security test: ${id}`);
		this.#budget = this.#policy.safety.max_requests;
		const results: AgentTestSecurityResult[] = [];
		for (const test of selected) {
			const evidence = await this.#probe(test);
			const checks = judge(test.expect, evidence);
			const result = { test, passed: checks.every((check) => check.passed), checks, evidence };
			results.push(result);
			this.#onResult?.(result);
		}
		return {
			policy: name,
			runId: this.#runId,
			target: { url: target.url, environment: target.environment },
			passed: results.filter((result) => result.passed).length,
			total: results.length,
			results
		};
	};

	/** Send one Test's scenario and collect its evidence. */
	readonly #probe = async (test: AgentTestSecurityTest): Promise<AgentTestSecurityEvidence> => {
		const { target } = this.#policy;
		const detection = test.expect.detection_event !== undefined ? target.detection : undefined;
		const detectionHeaders = detection ? expandHeaders(detection.headers, this.#env) : {};
		const before = detection
			? await countEvents(this.#fetch, detection.url, detectionHeaders, target.timeout_ms)
			: 0;
		const interval = (test.duration_seconds * 1000) / test.requests;
		const evidence: AgentTestSecurityEvidence = {
			sent: 0,
			statuses: {},
			succeeded: 0,
			rateLimited: 0,
			quotaRejected: 0,
			succeededAfterQuota: 0,
			elapsedMs: 0
		};
		const start = this.#now();
		let last: number | undefined;
		for (let index = 0; index < test.requests; index++) {
			if (this.#budget <= 0)
				throw new Error(`Stopped at safety.max_requests (${this.#policy.safety.max_requests})`);
			if (last !== undefined && interval > 0) await this.#sleep(last + interval - this.#now());
			last = this.#now();
			const placeholders = {
				prompt: scenarioPrompt(test.scenario, index),
				index: String(index),
				scenario: test.scenario,
				run_id: this.#runId
			};
			const headers = {
				...expandHeaders({ ...target.headers, ...test.headers }, this.#env, placeholders),
				[RUN_HEADER]: this.#runId,
				[TEST_HEADER]: test.id
			};
			const body = expandValue(target.body, this.#env, placeholders);
			this.#budget--;
			const response = await send(this.#fetch, target.url, headers, body, target.timeout_ms);
			this.#record(evidence, response);
		}
		if (detection) {
			const deadline = this.#now() + detection.wait_ms;
			let after = await countEvents(
				this.#fetch,
				detection.url,
				detectionHeaders,
				target.timeout_ms
			);
			while (after <= before && this.#now() < deadline) {
				await this.#sleep(Math.min(250, deadline - this.#now()));
				after = await countEvents(this.#fetch, detection.url, detectionHeaders, target.timeout_ms);
			}
			evidence.detectionEvents = Math.max(0, after - before);
		}
		evidence.elapsedMs = this.#now() - start;
		return evidence;
	};

	/** Classify one response, quota first, and update the counts. */
	readonly #record = (evidence: AgentTestSecurityEvidence, response: ProbeResponse): void => {
		const { signals } = this.#policy.target;
		evidence.sent++;
		evidence.statuses[response.status] = (evidence.statuses[response.status] ?? 0) + 1;
		if (matches(signals.quota, response)) {
			evidence.quotaRejected++;
			evidence.firstQuota ??= evidence.sent;
		} else if (matches(signals.rate_limit, response)) {
			evidence.rateLimited++;
			evidence.firstRateLimit ??= evidence.sent;
		} else if (response.status >= 200 && response.status < 300) {
			evidence.succeeded++;
			if (evidence.firstQuota !== undefined) evidence.succeededAfterQuota++;
		}
	};
}
