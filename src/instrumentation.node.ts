/** Why `value` can't be used as the backend origin, or null when it can. */
export function apiUrlProblem(value: string | undefined): string | null {
	if (!value) return 'API_URL is not set';
	const url = URL.canParse(value) ? new URL(value) : null;
	if (!url || !['http:', 'https:'].includes(url.protocol)) return 'API_URL must be an http(s) URL';
	if (url.pathname !== '/' || url.search || url.hash || url.username || url.password)
		return 'API_URL must be an origin only (no path such as /api/v1, query or credentials)';
	return null;
}

/**
 * Fail fast at server start: with a missing or malformed API_URL every proxied request would
 * fail. A throw in `register` only makes Next answer 500 to everything while staying up, so
 * exit instead.
 */
export function requireBackendOrigin() {
	const problem = apiUrlProblem(process.env.API_URL);
	if (!problem) return;
	console.error(`${problem}. Set it to the backend origin (see .env.example).`);
	process.exit(1);
}
