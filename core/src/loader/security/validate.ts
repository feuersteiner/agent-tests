import { AgentTestSecurityPolicySchema } from '../types.ts';
import type { AgentTestSecurityPolicy } from '../types.ts';
import { describeIssues } from '../helpers/issues.ts';

/** How the caller authorizes the run beyond the policy file itself. */
export interface AgentTestSecurityOptions {
	/** The `--allow-production` flag: a production target needs it and `safety.allow_production`. */
	allowProduction?: boolean;
}

/** Hosts every policy may target without listing them. */
export const LOCAL_HOSTS = ['localhost', '127.0.0.1', '[::1]'];

/** Validate a parsed value as a security policy, or throw `path: message` lines: every schema problem; else, once the schema passes, every rule and safety problem. */
export const validateSecurityPolicy = (
	value: unknown,
	options: AgentTestSecurityOptions = {}
): AgentTestSecurityPolicy => {
	const result = AgentTestSecurityPolicySchema.safeParse(value);
	if (!result.success) throw new Error(describeIssues(result.error.issues).join('\n'));
	const problems = policyProblems(result.data, options);
	if (problems.length) throw new Error(problems.join('\n'));
	return result.data;
};

/** Problems the schema cannot express: duplicate ids, budgets, regexes, and every host and environment authorization. */
const policyProblems = (
	policy: AgentTestSecurityPolicy,
	{ allowProduction = false }: AgentTestSecurityOptions
): string[] => {
	const { target, tests, safety } = policy;
	const ids = new Set<string>();
	const total = tests.reduce((sum, test) => sum + test.requests, 0);
	const urls: [string, string][] = [
		['target.url', target.url],
		...(target.detection
			? [['target.detection.url', target.detection.url] as [string, string]]
			: [])
	];
	const allowed = new Set([
		...LOCAL_HOSTS,
		...safety.allowed_hosts.map((host) => host.toLowerCase())
	]);
	return [
		...tests.flatMap(({ id }, index) => {
			const duplicate = ids.has(id);
			ids.add(id);
			return duplicate ? [`tests.${index}.id: Duplicate test id`] : [];
		}),
		...(total > safety.max_requests
			? [
					`safety.max_requests: The tests send ${total} requests, over the limit of ${safety.max_requests}`
				]
			: []),
		...(['rate_limit', 'quota'] as const).flatMap((signal) => {
			const body = target.signals[signal].body;
			return body === undefined || compiles(body)
				? []
				: [`target.signals.${signal}.body: Invalid regular expression`];
		}),
		...tests.flatMap(({ expect }, index) =>
			expect.detection_event !== undefined && !target.detection
				? [`tests.${index}.expect.detection_event: Requires target.detection`]
				: []
		),
		...urls.flatMap(([path, value]) => {
			const url = new URL(value);
			if (url.username || url.password)
				return [`${path}: Credentials in the URL are not allowed; use headers with \${VAR}`];
			return allowed.has(url.hostname.toLowerCase())
				? []
				: [`${path}: Host ${url.hostname} is not authorized; list it in safety.allowed_hosts`];
		}),
		...(target.environment === 'production' && !safety.allow_production
			? ['target.environment: Production targets need safety.allow_production: true']
			: []),
		...(target.environment === 'production' && !allowProduction
			? ['target.environment: Production targets need the --allow-production flag']
			: [])
	];
};

const compiles = (pattern: string): boolean => {
	try {
		new RegExp(pattern, 'i');
		return true;
	} catch {
		return false;
	}
};
