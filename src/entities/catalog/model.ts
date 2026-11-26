import type { Category } from '@/shared/api/types';

type Localized = { uz?: string; ru?: string; en?: string } | undefined;

/** Pick the current locale, falling back to uz (the only required translation). */
export function localized(text: Localized, locale: string) {
	if (!text) return '—';
	return (
		(text as Record<string, string | undefined>)[locale]?.trim() ||
		text.uz ||
		text.ru ||
		text.en ||
		'—'
	);
}

export interface CategoryNode extends Category {
	children: CategoryNode[];
	depth: number;
}

const bySort = (a: Category, b: Category) =>
	(a.sortOrder ?? 0) - (b.sortOrder ?? 0) || (a.name?.uz ?? '').localeCompare(b.name?.uz ?? '');

/** Flat list → tree via parentId. Orphans (missing parent) are attached to the root. */
export function buildCategoryTree(list: Category[]): CategoryNode[] {
	const nodes = new Map<string, CategoryNode>();
	for (const c of list) if (c.id) nodes.set(c.id, { ...c, children: [], depth: 0 });
	const roots: CategoryNode[] = [];
	for (const n of nodes.values()) {
		const parent = n.parentId ? nodes.get(n.parentId) : undefined;
		if (parent && parent !== n) parent.children.push(n);
		else roots.push(n);
	}
	const walk = (arr: CategoryNode[], depth: number) => {
		arr.sort(bySort);
		for (const n of arr) {
			n.depth = depth;
			walk(n.children, depth + 1);
		}
	};
	walk(roots, 0);
	return roots;
}

export function flattenTree(roots: CategoryNode[]): CategoryNode[] {
	const out: CategoryNode[] = [];
	const walk = (arr: CategoryNode[]) => arr.forEach(n => (out.push(n), walk(n.children)));
	walk(roots);
	return out;
}

/** Ids of `id` and all of its descendants — a category can't be moved under these. */
export function selfAndDescendants(list: Category[], id: string): Set<string> {
	const out = new Set<string>([id]);
	let grew = true;
	while (grew) {
		grew = false;
		for (const c of list) {
			if (c.id && c.parentId && out.has(c.parentId) && !out.has(c.id)) {
				out.add(c.id);
				grew = true;
			}
		}
	}
	return out;
}

const TRANSLIT: Record<string, string> = {
	а: 'a',
	б: 'b',
	в: 'v',
	г: 'g',
	д: 'd',
	е: 'e',
	ё: 'yo',
	ж: 'j',
	з: 'z',
	и: 'i',
	й: 'y',
	к: 'k',
	л: 'l',
	м: 'm',
	н: 'n',
	о: 'o',
	п: 'p',
	р: 'r',
	с: 's',
	т: 't',
	у: 'u',
	ф: 'f',
	х: 'x',
	ц: 'ts',
	ч: 'ch',
	ш: 'sh',
	щ: 'sh',
	ъ: '',
	ы: 'i',
	ь: '',
	э: 'e',
	ю: 'yu',
	я: 'ya',
	ў: 'o',
	қ: 'q',
	ғ: 'g',
	ҳ: 'h',
};

/** "Santexnika ishlari" → "santexnika-ishlari" (matches ^[a-z0-9]+(-[a-z0-9]+)*$). */
export function slugify(input: string) {
	let s = input.toLowerCase().replace(/[ʻʼ‘’`]/g, "'");
	s = s.replace(/([og])'/g, '$1'); // o' / g' (Uzbek Latin) → o / g
	s = [...s].map(ch => TRANSLIT[ch] ?? ch).join('');
	return s
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 80)
		.replace(/-+$/g, '');
}

export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * The `icon` key to send on save. Sending a key replaces an uploaded icon, so while one is
 * set (`customIcon`) an unchanged key is left out.
 */
export function iconForSave(value: string, original: string | undefined, customIcon: boolean) {
	if (customIcon && value === (original ?? '')) return undefined;
	return value || undefined;
}
