import { expect, it } from 'vitest';
import ru from './messages/ru.json';
import uz from './messages/uz.json';

function leafPaths(obj: object, prefix = ''): string[] {
	return Object.entries(obj).flatMap(([key, value]) =>
		typeof value === 'object' && value !== null
			? leafPaths(value, `${prefix}${key}.`)
			: [`${prefix}${key}`],
	);
}

it('ru.json has exactly the keys of uz.json', () => {
	expect(leafPaths(ru).sort()).toEqual(leafPaths(uz).sort());
});
