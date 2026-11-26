import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';
import { GET, POST } from './route';

vi.mock('server-only', () => ({}));

type Ctx = Parameters<typeof GET>[1];
const ctx = (...path: string[]) => ({ params: Promise.resolve({ path }) }) as Ctx;

function request(url: string, init?: ConstructorParameters<typeof NextRequest>[1]) {
	return new NextRequest(new URL(url, 'http://admin.test'), init);
}

describe('/api/v1 proxy', () => {
	it.each([['..', 'auth', 'refresh'], ['.'], ['a/b'], ['']])(
		'rejects unsafe segment %j',
		async (...path) => {
			const res = await GET(request('/api/v1/x'), ctx(...path));
			expect(res.status).toBe(400);
			expect(await res.json()).toMatchObject({ code: 'INVALID_PATH' });
		},
	);

	it.each([
		['auth', 'refresh'],
		['Auth', 'OTP', 'Verify'],
		['auth', 'logout'],
	])('blocks token endpoint %j', async (...path) => {
		const res = await POST(request('/api/v1/x', { method: 'POST', body: '{}' }), ctx(...path));
		expect(res.status).toBe(404);
	});

	it('forwards only allow-listed headers and keeps the query string', async () => {
		const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ ok: true }));
		vi.stubGlobal('fetch', fetchMock);

		const res = await GET(
			request('/api/v1/admin/users?page=1&sort=createdAt,DESC', {
				headers: { authorization: 'Bearer t', cookie: 'usta_rt=secret', 'x-evil': '1' },
			}),
			ctx('admin', 'users'),
		);

		expect(res.status).toBe(200);
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('http://backend.test/api/v1/admin/users?page=1&sort=createdAt,DESC');
		const headers = new Headers(init?.headers);
		expect(headers.get('authorization')).toBe('Bearer t');
		expect(headers.get('cookie')).toBeNull();
		expect(headers.get('x-evil')).toBeNull();
	});

	it('rejects bodies over 1 MiB', async () => {
		const res = await POST(
			request('/api/v1/admin/x', { method: 'POST', body: 'x'.repeat(1024 * 1024 + 1) }),
			ctx('admin', 'x'),
		);
		expect(res.status).toBe(413);
	});

	it('maps an unreachable backend to 502', async () => {
		vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockRejectedValue(new TypeError('fetch failed')));
		const res = await GET(request('/api/v1/admin/users'), ctx('admin', 'users'));
		expect(res.status).toBe(502);
	});
});
