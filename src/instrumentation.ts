import type { Instrumentation } from 'next';

export async function register() {
	if (process.env.NEXT_PHASE === 'phase-production-build') return;
	if (process.env.NEXT_RUNTIME === 'nodejs') {
		const { requireBackendOrigin } = await import('./instrumentation.node');
		requireBackendOrigin();
	}
}

/** Server errors (render, route handlers, proxy) — one structured log line per error. */
export const onRequestError: Instrumentation.onRequestError = (err, request, context) => {
	const e = err as Error & { digest?: string };
	console.error(
		JSON.stringify({
			level: 'error',
			message: e.message,
			digest: e.digest,
			method: request.method,
			path: request.path,
			routePath: context.routePath,
			routeType: context.routeType,
		}),
	);
};
