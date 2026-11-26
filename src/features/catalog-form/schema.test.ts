import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { catalogCommonFields, type CatalogSchemaMessages } from './schema';

const m: CatalogSchemaMessages = {
	required: 'req',
	slugInvalid: 'slug-invalid',
	unknownIcon: 'unknown-icon',
	invalidNumber: 'nan',
	maxLength: n => `max${n}`,
};

const valid = { slug: 'santexnika', icon: 'wrench', sortOrder: 0, status: 'INACTIVE' };
const schema = z.object(catalogCommonFields(m, new Set(['wrench'])));
const issue = (input: unknown, path: string) =>
	schema.safeParse(input).error?.issues.find(i => i.path.join('.') === path)?.message;

describe('catalogCommonFields', () => {
	it('accepts a valid item', () => {
		expect(schema.safeParse(valid).success).toBe(true);
	});

	it('rejects a slug that is not kebab-case latin', () => {
		expect(issue({ ...valid, slug: 'Bad Slug' }, 'slug')).toBe('slug-invalid');
	});

	it('rejects a slug longer than 80 characters', () => {
		expect(issue({ ...valid, slug: 'a'.repeat(81) }, 'slug')).toBe('max80');
	});

	it('rejects an empty slug as required', () => {
		expect(issue({ ...valid, slug: '' }, 'slug')).toBe('req');
	});

	it('limits sortOrder to 0..100000 and allows it to be empty', () => {
		expect(schema.safeParse({ ...valid, sortOrder: 100001 }).success).toBe(false);
		expect(schema.safeParse({ ...valid, sortOrder: undefined }).success).toBe(true);
	});

	it('rejects an icon key the server does not know', () => {
		expect(issue({ ...valid, icon: 'nope' }, 'icon')).toBe('unknown-icon');
	});

	it('accepts any icon key while the icon list is not loaded', () => {
		const loose = z.object(catalogCommonFields(m, null));
		expect(loose.safeParse({ ...valid, icon: 'nope' }).success).toBe(true);
	});
});
