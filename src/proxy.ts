import { NextResponse, type NextRequest } from 'next/server';
import { REFRESH_COOKIE } from '@/shared/config/env';

/**
 * Cheap pre-check: without a refresh cookie there is no session, so skip rendering the
 * dashboard and go straight to /login. Real authorization (ADMIN role) is enforced by the
 * backend and by AdminGuard.
 */
export function proxy(req: NextRequest) {
	if (!req.cookies.has(REFRESH_COOKIE)) {
		const url = req.nextUrl.clone();
		url.pathname = '/login';
		url.search =
			req.nextUrl.pathname === '/'
				? ''
				: `?next=${encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)}`;
		return NextResponse.redirect(url);
	}
	return NextResponse.next();
}

export const config = {
	matcher: ['/((?!api|login|_next|favicon.ico|.*\\.[a-z0-9]+$).*)'],
};
