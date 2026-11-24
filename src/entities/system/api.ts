'use client';

import { useQuery } from '@tanstack/react-query';
import { http } from '@/shared/api/client';
import type { MetaResponse, Page } from '@/shared/api/types';

export function useServerMeta() {
	return useQuery({
		queryKey: ['public', 'meta'],
		queryFn: () => http.get<MetaResponse>('/public/meta', undefined, { skipAuth: true }),
	});
}

/** KPI = `totalElements` of a list endpoint queried with size=1 (no stats endpoint yet). */
export function useCount(path: string, params: Record<string, string | undefined>) {
	return useQuery({
		queryKey: ['admin', 'count', path, params],
		queryFn: () =>
			http.get<Page<unknown>>(path, { ...params, size: 1 }).then(p => p.totalElements ?? 0),
	});
}

export const systemApi = {
	reindex: () => http.post<Record<string, number>>('/admin/search/reindex'),
};
