import type { BrowserContext, Page, Route } from '@playwright/test';

export const ALL_PERMISSIONS = [
	'USERS',
	'MASTERS',
	'CATALOG',
	'ORDERS',
	'FINANCE',
	'COMPLAINTS',
	'SYSTEM',
	'DELETE',
];

export const ADMIN = {
	id: '00000000-0000-0000-0000-000000000001',
	phone: '+998901234567',
	roles: ['ADMIN'],
	permissions: ALL_PERMISSIONS,
	status: 'ACTIVE',
};

export const SUPER_ADMIN = { ...ADMIN, roles: ['SUPER_ADMIN'], permissions: [] };

export function page<T>(items: T[], { page = 0, size = 20, totalPages = 1 } = {}) {
	return { items, page, size, totalElements: totalPages * size, totalPages };
}

export const problem = (route: Route, status: number, code: string, detail = code) =>
	route.fulfill({
		status,
		contentType: 'application/problem+json',
		body: JSON.stringify({ status, code, detail }),
	});

/**
 * Logged-in admin: fake refresh cookie (passes src/proxy.ts), mocked refresh and /me, and
 * empty defaults for every other API call. Register specific routes after this one —
 * Playwright tries the most recently added route first.
 */
export async function mockAdminSession(context: BrowserContext, p: Page, user: object = ADMIN) {
	await context.addCookies([{ name: 'usta_rt', value: 'fake', url: 'http://127.0.0.1:4020' }]);
	await p.route('**/api/v1/**', route => {
		const { pathname } = new URL(route.request().url());
		// endpoints that return a plain array rather than a page envelope
		const isList = !/\/(services|portfolio|categories|admins|permissions|icons|dead)$/.test(
			pathname,
		);
		return route.fulfill({ json: isList ? page([]) : [] });
	});
	await p.route('**/api/session/refresh', route =>
		route.fulfill({
			json: {
				accessToken: 'test-token',
				accessTokenExpiresAt: new Date(Date.now() + 3_600_000).toISOString(),
				user,
			},
		}),
	);
	await p.route('**/api/v1/me', route => route.fulfill({ json: user }));
}
