import { NextResponse } from 'next/server';
import {
	backendFetch,
	clearRefreshCookie,
	gatewayError,
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
	if (!rt) return NextResponse.json({ status: 401, code: 'NO_SESSION' }, { status: 401 });

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

	if (res.status >= 500) return NextResponse.json({ status: res.status }, { status: 502 });
	if (!res.ok) {
		await clearRefreshCookie();
		return NextResponse.json({ status: 401, code: 'SESSION_EXPIRED' }, { status: 401 });
	}

	const tokens = (await res.json()) as TokenResponse;
	if (!tokens.user?.roles?.includes('ADMIN') || tokens.user.status === 'BLOCKED') {
		if (tokens.refreshToken) await revokeRefreshToken(tokens.refreshToken);
		await clearRefreshCookie();
		return NextResponse.json({ status: 403, code: 'NOT_ADMIN' }, { status: 403 });
	}

	await writeRefreshCookie(tokens);
	return NextResponse.json(toSessionPayload(tokens));
}
