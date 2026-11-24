import type { NextRequest } from 'next/server';
import {
	backendFetch,
	gatewayError,
	passthrough,
	problem,
	readBodyLimited,
} from '@/shared/api/backend.server';

/**
 * Same-origin proxy for /api/v1/* → backend. The backend rejects browser CORS preflights,
 * and proxying also keeps the backend origin out of the client bundle.
 *
 * Token endpoints are not proxied: they go through /api/session so the refresh token
 * never reaches JavaScript.
 */
const BLOCKED = new Set(['auth/otp/verify', 'auth/refresh', 'auth/logout']);
const FORWARD_HEADERS = ['authorization', 'content-type', 'accept-language'];

async function handler(req: NextRequest, ctx: RouteContext<'/api/v1/[...path]'>) {
	const { path } = await ctx.params;
	// Reject dot-segments / separators: fetch() would normalise `x/../auth/refresh`
	// after the blocklist check, escaping /api/v1 and the blocklist.
	if (path.some(s => !s || s === '.' || s === '..' || /[/\\\0]/.test(s))) {
		return problem(400, 'INVALID_PATH', 'Invalid path');
	}
	const joined = path.map(encodeURIComponent).join('/');
	if (BLOCKED.has(path.join('/').toLowerCase())) {
		return problem(404, 'NOT_FOUND', 'Use /api/session');
	}

	const headers = new Headers();
	for (const h of FORWARD_HEADERS) {
		const v = req.headers.get(h);
		if (v) headers.set(h, v);
	}

	const hasBody = !['GET', 'HEAD'].includes(req.method);
	const body = hasBody ? await readBodyLimited(req) : undefined;
	if (body instanceof Response) return body;
	try {
		const res = await backendFetch(`/${joined}${req.nextUrl.search}`, {
			method: req.method,
			headers,
			body,
		});
		return passthrough(res);
	} catch (e) {
		return gatewayError(e);
	}
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
