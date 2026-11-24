import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
	backendFetch,
	clearRefreshCookie,
	gatewayError,
	passthrough,
	problem,
	readBodyLimited,
	readRefreshCookie,
	revokeRefreshToken,
	toSessionPayload,
	writeRefreshCookie,
} from '@/shared/api/backend.server';
import type { TokenResponse } from '@/shared/api/types';

/** Login: verify OTP, require ADMIN role, store refresh token in an httpOnly cookie. */
export async function POST(req: NextRequest) {
	const lang = req.headers.get('accept-language');
	// Login body is just { phone, code }.
	const body = await readBodyLimited(req, 4096);
	if (body instanceof Response) return body;
	let res: Response;
	try {
		res = await backendFetch('/auth/otp/verify', {
			method: 'POST',
			lang,
			headers: { 'content-type': 'application/json' },
			body,
		});
	} catch (e) {
		return gatewayError(e);
	}
	if (!res.ok) return passthrough(res);

	const tokens = (await res.json()) as TokenResponse;
	const user = tokens.user;
	const isAdmin = user?.roles?.includes('ADMIN');
	if (!isAdmin || user?.status === 'BLOCKED') {
		if (tokens.refreshToken) await revokeRefreshToken(tokens.refreshToken, lang);
		return problem(403, isAdmin ? 'USER_BLOCKED' : 'NOT_ADMIN');
	}

	await writeRefreshCookie(tokens);
	return NextResponse.json(toSessionPayload(tokens));
}

/** Logout: revoke refresh token on the backend and drop the cookie. */
export async function DELETE(req: NextRequest) {
	const rt = await readRefreshCookie();
	if (rt) await revokeRefreshToken(rt, req.headers.get('accept-language'));
	await clearRefreshCookie();
	return new NextResponse(null, { status: 204 });
}
