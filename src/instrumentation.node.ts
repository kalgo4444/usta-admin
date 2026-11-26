/**
 * Fail fast at server start: without API_URL every proxied request would fail. A throw in
 * `register` only makes Next answer 500 to everything while staying up, so exit instead.
 */
export function requireBackendOrigin() {
	if (process.env.API_URL) return;
	console.error('API_URL is not set. Set it to the backend origin (see .env.example).');
	process.exit(1);
}
