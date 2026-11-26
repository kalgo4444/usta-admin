import { describe, expect, it } from 'vitest';
import { hasAccess, isAdmin, isSuperAdmin } from './access';
import { sanitizeDeep, sanitizeText } from './text';

describe('access', () => {
	const admin = { roles: ['ADMIN' as const], permissions: ['USERS' as const, 'DELETE' as const] };
	const superAdmin = { roles: ['SUPER_ADMIN' as const], permissions: [] };

	it('recognises admin roles', () => {
		expect(isAdmin(admin)).toBe(true);
		expect(isAdmin(superAdmin)).toBe(true);
		expect(isAdmin({ roles: ['CUSTOMER'] })).toBe(false);
		expect(isSuperAdmin(admin)).toBe(false);
	});

	it('requires every listed permission', () => {
		expect(hasAccess(admin, 'USERS')).toBe(true);
		expect(hasAccess(admin, 'USERS', 'DELETE')).toBe(true);
		expect(hasAccess(admin, 'CATALOG', 'DELETE')).toBe(false);
		expect(hasAccess(admin, 'SUPER_ADMIN')).toBe(false);
		expect(hasAccess(undefined, 'USERS')).toBe(false);
	});

	it('gives a super admin everything', () => {
		expect(hasAccess(superAdmin, 'FINANCE', 'DELETE', 'SUPER_ADMIN')).toBe(true);
	});
});

describe('sanitize', () => {
	it('strips invisible and control characters but keeps newlines and Uzbek letters', () => {
		expect(sanitizeText('a‮b​c\u0007')).toBe('abc');
		expect(sanitizeText('Oʻzbekiston\nqator')).toBe('Oʻzbekiston\nqator');
	});

	it('walks nested bodies', () => {
		expect(sanitizeDeep({ name: { uz: 'x​' }, list: ['﻿y'], n: 1 })).toEqual({
			name: { uz: 'x' },
			list: ['y'],
			n: 1,
		});
	});
});
