import { command, type Command } from 'clinguini';
import { loadSecurityPolicy, SECURITY_PATH } from '../../src/loader/index.ts';
import { PROTECTED_DEFENSES, startMockApi } from '../../src/mock/index.ts';
import type { MockDefenses } from '../../src/mock/index.ts';
import { ProbeOrchestrator } from '../../src/probe/index.ts';
import type { AgentTestSecurityResult } from '../../src/probe/types.ts';
import { message } from '../helpers/error.ts';

const policyFlag = {
	name: 'policy',
	type: 'string' as const,
	description: `Policy file; defaults to ${SECURITY_PATH}.`
};

/** The policy path a flag value names, else the default. */
const toPath = (value: unknown): string => (typeof value === 'string' ? value : SECURITY_PATH);

/** `PASS|FAIL  <test>  <expectation>: expected <x>, got <y> (<detail>)`, one line per check. */
const toLines = ({ test, checks }: AgentTestSecurityResult): string[] =>
	checks.map(
		(check) =>
			`${check.passed ? 'PASS' : 'FAIL'}  ${test.id}  ${check.expectation}: expected ${check.expected}, got ${check.actual} (${check.detail})`
	);

const runSubcommand: Command = command({
	name: 'run',
	description: 'Run the security policy against its target.',
	params: [{ name: 'id', optional: true, description: 'Exact security test ID; omit for all.' }],
	flags: [
		policyFlag,
		{ name: 'json', type: 'boolean', description: 'Print the full report as JSON instead.' },
		{
			name: 'allow-production',
			type: 'boolean',
			description: 'Authorize a production target that the policy also allows.'
		}
	],
	handler: async ({ params, flags }): Promise<void> => {
		try {
			const policy = loadSecurityPolicy(toPath(flags.policy), {
				allowProduction: flags['allow-production'] === true
			});
			const asJson = flags.json === true;
			if (!asJson)
				console.log(
					`Security evaluation: ${policy.name} → ${policy.target.url} (${policy.target.environment})`
				);
			const report = await new ProbeOrchestrator(policy, process.env, {
				onResult: (result) => {
					if (!asJson) for (const line of toLines(result)) console.log(line);
				}
			}).run(params.id);
			if (asJson) console.log(JSON.stringify(report, null, 2));
			else console.log(`Result: ${report.passed} of ${report.total} security test(s) passed.`);
			process.exitCode = report.passed === report.total ? 0 : 1;
		} catch (error) {
			console.error(`Error: ${message(error)}`);
			process.exitCode = 2;
		}
	}
});

const validateSubcommand: Command = command({
	name: 'validate',
	description: 'Validate the security policy without sending a request.',
	flags: [
		policyFlag,
		{
			name: 'allow-production',
			type: 'boolean',
			description: 'Authorize a production target that the policy also allows.'
		}
	],
	handler: ({ flags }): void => {
		try {
			const policy = loadSecurityPolicy(toPath(flags.policy), {
				allowProduction: flags['allow-production'] === true
			});
			const total = policy.tests.reduce((sum, test) => sum + test.requests, 0);
			console.log(
				`Policy ${policy.name} valid: ${policy.tests.length} security test(s), ${total} of ${policy.safety.max_requests} request(s).`
			);
		} catch (error) {
			console.error(`Error: ${message(error)}`);
			process.exitCode = 2;
		}
	}
});

/** The defense names `--disable` accepts, mapped to the mock's keys. */
const DEFENSES = { 'rate-limit': 'rateLimit', quota: 'quota', detection: 'detection' } as const;

const mockSubcommand: Command = command({
	name: 'mock',
	description: 'Serve a local mock AI API with extraction defenses, until stopped.',
	flags: [
		{ name: 'port', type: 'number', default: 4010, description: 'Port on 127.0.0.1; 0 picks one.' },
		{
			name: 'disable',
			type: 'string',
			description: 'Comma-separated defenses to remove: rate-limit, quota, detection.'
		}
	],
	handler: async ({ flags }): Promise<void> => {
		try {
			const names =
				typeof flags.disable === 'string'
					? flags.disable
							.split(',')
							.map((name) => name.trim())
							.filter(Boolean)
					: [];
			const defenses: MockDefenses = { ...PROTECTED_DEFENSES };
			for (const name of names) {
				if (!(name in DEFENSES))
					throw new Error(`Unknown defense: ${name}; use rate-limit, quota, or detection`);
				delete defenses[DEFENSES[name as keyof typeof DEFENSES]];
			}
			const port = typeof flags.port === 'number' ? flags.port : 4010;
			const api = await startMockApi({ port, defenses });
			const active = Object.keys(DEFENSES).filter((name) => !names.includes(name));
			console.log(`Mock API listening on ${api.url} (defenses: ${active.join(', ') || 'none'})`);
			const stop = (): void => {
				void api.close().then(() => process.exit(0));
			};
			process.once('SIGINT', stop);
			process.once('SIGTERM', stop);
		} catch (error) {
			console.error(`Error: ${message(error)}`);
			process.exitCode = 2;
		}
	}
});

export const securityCommand: Command = command({
	name: 'security',
	description: 'Test an AI API against model extraction: rate limits, quotas, and detection.',
	commands: [runSubcommand, validateSubcommand, mockSubcommand]
});
