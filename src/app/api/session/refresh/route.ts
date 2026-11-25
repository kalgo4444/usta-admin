import { NextResponse } from 'next/server';
import {
	backendFetch,
	clearRefreshCookie,
	gatewayError,
	isActiveAdmin,
	problem,
	readRefreshCookie,
	readTokens,
	revokeRefreshToken,
	toSessionPayload,
	writeRefreshCookie,
} from '@/shared/api/backend.server';

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

	// Only an explicit rejection of the token ends the session; 429/408/5xx are transient.
	if (res.status === 400 || res.status === 401 || res.status === 403) {
		await clearRefreshCookie();
		return problem(401, 'SESSION_EXPIRED');
	}
	if (!res.ok) return problem(502, 'UPSTREAM_ERROR', `Backend responded ${res.status}`);

	const tokens = await readTokens(res);
	if (!tokens) return problem(502, 'UPSTREAM_ERROR', 'Backend returned an invalid response');
	if (!isActiveAdmin(tokens.user)) {
		if (tokens.refreshToken) await revokeRefreshToken(tokens.refreshToken);
		await clearRefreshCookie();
		return problem(403, 'NOT_ADMIN');
	}

	await writeRefreshCookie(tokens);
	return NextResponse.json(toSessionPayload(tokens));
}
