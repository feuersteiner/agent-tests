/** Copy defined environment values, preserving empty strings without mutating the input. */
export const collectEnvironment = (environment: NodeJS.ProcessEnv): Record<string, string> =>
	Object.fromEntries(
		Object.entries(environment).filter((entry): entry is [string, string] => entry[1] !== undefined)
	);
