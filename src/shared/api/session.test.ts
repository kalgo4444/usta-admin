import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	ensureAccessToken,
	refreshSession,
	SessionExpiredError,
	sessionStore,
	type SessionPayload,
} from './session';

const user = { id: 'u1', roles: ['ADMIN'], status: 'ACTIVE' } as SessionPayload['user'];

function payload(token: string, msFromNow = 15 * 60_000): SessionPayload {
	return {
		accessToken: token,
		accessTokenExpiresAt: new Date(Date.now() + msFromNow).toISOString(),
		user,
	};
}

function mockFetch(...responses: Response[]) {
	const fn = vi.fn<typeof fetch>();
	for (const r of responses) fn.mockResolvedValueOnce(r);
	vi.stubGlobal('fetch', fn);
	return fn;
}

beforeEach(() => sessionStore.clear());

describe('refreshSession', () => {
	it('shares one in-flight refresh between concurrent callers', async () => {
		const fetchMock = mockFetch(Response.json(payload('new')));
		const tokens = await Promise.all([refreshSession(), refreshSession(), ensureAccessToken()]);
		expect(tokens).toEqual(['new', 'new', 'new']);
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(sessionStore.get()?.accessToken).toBe('new');
	});

	it('ends the session on 401', async () => {
		sessionStore.set(payload('old', -1));
		mockFetch(new Response(null, { status: 401 }));
		await expect(refreshSession()).rejects.toBeInstanceOf(SessionExpiredError);
		expect(sessionStore.get()).toBeNull();
	});

	it('keeps the session on a transient failure', async () => {
		sessionStore.set(payload('old', -1));
		mockFetch(new Response(null, { status: 502 }));
		await expect(refreshSession()).rejects.toThrow('REFRESH_FAILED_502');
		expect(sessionStore.get()?.accessToken).toBe('old');
	});
});

describe('ensureAccessToken', () => {
	it('uses the cached token while it is not about to expire', async () => {
		sessionStore.set(payload('cached'));
		const fetchMock = mockFetch();
		await expect(ensureAccessToken()).resolves.toBe('cached');
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('refreshes proactively within 30 s of expiry', async () => {
		sessionStore.set(payload('stale', 10_000));
		const fetchMock = mockFetch(Response.json(payload('fresh')));
		await expect(ensureAccessToken()).resolves.toBe('fresh');
		expect(fetchMock).toHaveBeenCalledWith('/api/session/refresh', expect.anything());
	});
});
