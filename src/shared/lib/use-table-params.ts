'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { SortingState } from '@tanstack/react-table';

/** Sentinel for an explicitly chosen "All" when the filter has a non-empty default. */
export const ALL = 'ALL';

interface Options<F extends string> {
	filters: readonly F[];
	defaults?: Partial<Record<F, string>>;
	defaultSort?: string;
	defaultSize?: number;
}

/**
 * Keeps page / size / sort / filters in the URL so a reload or shared link restores the
 * exact table view (plan §7, acceptance criteria §11). `page` is zero-based like the API.
 */
export function useTableParams<F extends string>({
	filters,
	defaults,
	defaultSort,
	defaultSize = 20,
}: Options<F>) {
	const sp = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();

	const page = Math.max(0, Number(sp.get('page') ?? 0) || 0);
	const size = Math.min(100, Math.max(1, Number(sp.get('size') ?? defaultSize) || defaultSize));
	const sort = sp.get('sort') ?? defaultSort ?? '';

	// Memoised by the React Compiler: no useMemo/useCallback needed here.
	const values = {} as Record<F, string | undefined>;
	/** Values ready for the API: ALL/empty → undefined. */
	const apiFilters = {} as Record<F, string | undefined>;
	for (const f of filters) {
		const v = sp.get(f) ?? defaults?.[f] ?? undefined;
		values[f] = v;
		apiFilters[f] = v && v !== ALL ? v : undefined;
	}

	const update = (patch: Record<string, string | number | undefined | null>, resetPage = true) => {
		const next = new URLSearchParams(sp.toString());
		for (const [k, v] of Object.entries(patch)) {
			if (v === undefined || v === null || v === '') next.delete(k);
			else next.set(k, String(v));
		}
		if (resetPage && !('page' in patch)) next.delete('page');
		if (next.get('page') === '0') next.delete('page');
		const qs = next.toString();
		router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
	};

	const [sortId, sortDir] = sort.split(',');
	const sorting: SortingState = sort
		? [{ id: sortId, desc: (sortDir ?? '').toUpperCase() === 'DESC' }]
		: [];

	return {
		page,
		size,
		sort: sort || undefined,
		sorting,
		filters: values,
		apiFilters,
		setFilter: (key: F, value: string | undefined) => update({ [key]: value }),
		setFilters: (patch: Partial<Record<F, string | undefined>>) => update(patch),
		setPage: (p: number) => update({ page: p }, false),
		setSize: (s: number) => update({ size: s, page: undefined }),
		setSorting: (s: SortingState) =>
			update({ sort: s[0] ? `${s[0].id},${s[0].desc ? 'DESC' : 'ASC'}` : undefined }),
	};
}
