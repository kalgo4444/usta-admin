import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { backendFetch, gatewayError, passthrough } from '@/shared/api/backend.server';

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
	const joined = path.map(encodeURIComponent).join('/');
	if (BLOCKED.has(path.join('/'))) {
		return NextResponse.json({ status: 404, detail: 'Use /api/session' }, { status: 404 });
	}

	const headers = new Headers();
	for (const h of FORWARD_HEADERS) {
		const v = req.headers.get(h);
		if (v) headers.set(h, v);
	}

	const hasBody = !['GET', 'HEAD'].includes(req.method);
	try {
		const res = await backendFetch(`/${joined}${req.nextUrl.search}`, {
			method: req.method,
			headers,
			body: hasBody ? await req.arrayBuffer() : undefined,
		});
		return passthrough(res);
	} catch (e) {
		return gatewayError(e);
	}
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
