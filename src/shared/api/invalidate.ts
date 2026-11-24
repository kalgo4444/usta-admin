import type { QueryClient, QueryKey } from '@tanstack/react-query';

/** Invalidate the given keys plus every overview KPI counter. */
export function invalidate(qc: QueryClient, ...keys: QueryKey[]) {
	return Promise.all([
		...keys.map(queryKey => qc.invalidateQueries({ queryKey })),
		qc.invalidateQueries({ queryKey: ['admin', 'count'] }),
	]);
}
