import { describe, expect, it } from 'vitest';
import { iconForSave } from './model';

describe('iconForSave', () => {
	it('omits an unchanged key when an uploaded icon is set, so the upload is kept', () => {
		expect(iconForSave('wrench', 'wrench', true)).toBeUndefined();
	});

	it('sends a changed key even when an uploaded icon is set', () => {
		expect(iconForSave('drill', 'wrench', true)).toBe('drill');
	});

	it('sends nothing for an empty key', () => {
		expect(iconForSave('', undefined, false)).toBeUndefined();
	});

	it('sends the key when there is no uploaded icon', () => {
		expect(iconForSave('drill', undefined, false)).toBe('drill');
	});
});
