/** Liveness probe for Docker/orchestrators: the Next server is up and serving. */
export function GET() {
	return Response.json({ status: 'ok' });
}
