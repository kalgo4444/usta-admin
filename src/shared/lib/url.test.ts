import { describe, expect, it } from 'vitest';
import { safeNextPath } from './url';

const ORIGIN = 'https://admin.example';
const next = (v: string | null) => safeNextPath(v, ORIGIN, '/', '/login');

describe('safeNextPath', () => {
	it.each([
		'/.//evil.com',
		'/..//evil.com',
		'/%2e//evil.com',
		'/a/..//evil.com',
		'/./\\evil.com',
		'//evil.com',
		'/\\evil.com',
		'https://evil.com/masters',
		'javascript:alert(1)',
		'/login',
		'/login/x',
	])('falls back for %s', v => {
		expect(next(v)).toBe('/');
	});

	it('falls back when next is missing', () => {
		expect(next(null)).toBe('/');
		expect(next('')).toBe('/');
	});

	it('keeps a same-origin path with query and hash', () => {
		expect(next('/masters?status=PENDING#x')).toBe('/masters?status=PENDING#x');
		expect(next(`${ORIGIN}/orders/1`)).toBe('/orders/1');
	});
});
