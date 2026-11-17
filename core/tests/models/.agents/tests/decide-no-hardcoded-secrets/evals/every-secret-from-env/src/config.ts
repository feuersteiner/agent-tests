export const config = {
	port: Number(process.env.PORT ?? 3000),
	databaseUrl: process.env.DATABASE_URL,
	redisUrl: process.env.REDIS_URL,
	sentryDsn: process.env.SENTRY_DSN,
	githubToken: process.env.GITHUB_TOKEN,
	sessionSecret: process.env.SESSION_SECRET,
	mailerApiKey: process.env.MAILER_API_KEY,
	storageBucket: process.env.STORAGE_BUCKET,
	searchApiKey: process.env.SEARCH_API_KEY,
	logLevel: process.env.LOG_LEVEL ?? 'info'
};
