import { NextResponse } from 'next/server';
import {
	backendFetch,
	clearRefreshCookie,
	gatewayError,
	problem,
	readRefreshCookie,
	revokeRefreshToken,
	toSessionPayload,
	writeRefreshCookie,
} from '@/shared/api/backend.server';
import type { TokenResponse } from '@/shared/api/types';

/**
 * Exchange the cookie's refresh token for a new access token. The backend rotates the
 * refresh token on every call, so the new one replaces the cookie immediately.
 */
export async function POST() {
	const rt = await readRefreshCookie();
	if (!rt) return problem(401, 'NO_SESSION');

	let res: Response;
	try {
		res = await backendFetch('/auth/refresh', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ refreshToken: rt }),
		});
	} catch (e) {
		// Network/timeout: keep the cookie — the session may still be valid.
		return gatewayError(e);
	}

	if (res.status >= 500) return problem(502, 'UPSTREAM_ERROR', `Backend responded ${res.status}`);
	if (!res.ok) {
		await clearRefreshCookie();
		return problem(401, 'SESSION_EXPIRED');
	}

	const tokens = (await res.json()) as TokenResponse;
	if (!tokens.user?.roles?.includes('ADMIN') || tokens.user.status === 'BLOCKED') {
		if (tokens.refreshToken) await revokeRefreshToken(tokens.refreshToken);
		await clearRefreshCookie();
		return problem(403, 'NOT_ADMIN');
	}

	await writeRefreshCookie(tokens);
	return NextResponse.json(toSessionPayload(tokens));
}
