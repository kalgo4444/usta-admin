'use client';

import { useCallback, useMemo } from 'react';
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

	const filterKey = filters.join('|');
	const values = useMemo(() => {
		const out = {} as Record<F, string | undefined>;
		for (const f of filterKey.split('|') as F[]) out[f] = sp.get(f) ?? defaults?.[f] ?? undefined;
		return out;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [sp, filterKey]);

	/** Values ready for the API: ALL/empty → undefined. */
	const apiFilters = useMemo(() => {
		const out = {} as Record<F, string | undefined>;
		for (const [k, v] of Object.entries(values) as [F, string | undefined][])
			out[k] = v && v !== ALL ? v : undefined;
		return out;
	}, [values]);

	const update = useCallback(
		(patch: Record<string, string | number | undefined | null>, resetPage = true) => {
			const next = new URLSearchParams(sp.toString());
			for (const [k, v] of Object.entries(patch)) {
				if (v === undefined || v === null || v === '') next.delete(k);
				else next.set(k, String(v));
			}
			if (resetPage && !('page' in patch)) next.delete('page');
			if (next.get('page') === '0') next.delete('page');
			const qs = next.toString();
			router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
		},
		[sp, router, pathname],
	);

	const sorting: SortingState = useMemo(() => {
		if (!sort) return [];
		const [id, dir] = sort.split(',');
		return [{ id, desc: (dir ?? '').toUpperCase() === 'DESC' }];
	}, [sort]);

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
