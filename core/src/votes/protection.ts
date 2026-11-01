const object = (value: unknown): Record<string, unknown> =>
	typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};

const names = (value: unknown, key: string): string[] =>
	Array.isArray(value)
		? value
				.map((item) => object(item)[key])
				.filter((item): item is string => typeof item === 'string')
		: [];

const identities = (value: unknown) => {
	const input = object(value);
	return {
		users: names(input.users, 'login'),
		teams: names(input.teams, 'slug'),
		apps: names(input.apps, 'slug')
	};
};

const enabled = (value: unknown, fallback = false): boolean => {
	const option = object(value).enabled;
	return typeof option === 'boolean' ? option : fallback;
};

/** Strengthen required reviews/checks while carrying forward existing restrictions and bypasses. */
export const protectionBody = (value: unknown): Record<string, unknown> => {
	const before = object(value);
	const status = object(before.required_status_checks);
	const reviews = object(before.required_pull_request_reviews);
	const checks = Array.isArray(status.checks)
		? status.checks.map((item) => ({
				context: String(object(item).context),
				app_id: Number(object(item).app_id ?? -1)
			}))
		: [];
	for (const context of [
		...(Array.isArray(status.contexts) ? status.contexts : []),
		'Library add',
		'Library update',
		'Library score'
	])
		if (typeof context === 'string' && !checks.some((check) => check.context === context))
			checks.push({ context, app_id: -1 });

	const result: Record<string, unknown> = {
		required_status_checks: { strict: true, contexts: [], checks },
		enforce_admins: enabled(before.enforce_admins, true),
		required_pull_request_reviews: {
			dismiss_stale_reviews: true,
			require_code_owner_reviews: reviews.require_code_owner_reviews === true,
			required_approving_review_count: Math.max(
				Number(reviews.required_approving_review_count ?? 0),
				1
			),
			require_last_push_approval: reviews.require_last_push_approval === true,
			...(reviews.dismissal_restrictions
				? { dismissal_restrictions: identities(reviews.dismissal_restrictions) }
				: {}),
			...(reviews.bypass_pull_request_allowances
				? { bypass_pull_request_allowances: identities(reviews.bypass_pull_request_allowances) }
				: {})
		},
		restrictions: before.restrictions ? identities(before.restrictions) : null
	};
	for (const key of [
		'required_linear_history',
		'allow_force_pushes',
		'allow_deletions',
		'block_creations',
		'required_conversation_resolution',
		'lock_branch',
		'allow_fork_syncing'
	])
		if (key in before) result[key] = enabled(before[key]);
	return result;
};

/** Stable equality detects protection edits made between planning and application. */
export const protectionFingerprint = (value: unknown): string => {
	if (Array.isArray(value)) return `[${value.map(protectionFingerprint).join(',')}]`;
	if (typeof value === 'object' && value !== null)
		return `{${Object.entries(value)
			.sort(([left], [right]) => left.localeCompare(right))
			.map(([key, item]) => `${JSON.stringify(key)}:${protectionFingerprint(item)}`)
			.join(',')}}`;
	return JSON.stringify(value) ?? 'null';
};
