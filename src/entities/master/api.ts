'use client';

import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { cleanParams, http } from '@/shared/api/client';
import type {
	AdminMaster,
	AdminMasterDetail,
	MasterProfile,
	Page,
	PortfolioItem,
	PublicMasterService,
	PublicReview,
	VerificationStatus,
} from '@/shared/api/types';

interface MastersParams {
	status?: VerificationStatus;
	page?: number;
	size?: number;
	sort?: string;
}

export const masterKeys = {
	list: (p: MastersParams) => ['admin', 'masters', p] as const,
	detail: (id: string) => ['admin', 'master', id] as const,
	directory: ['admin', 'masters', 'directory'] as const,
	services: (id: string) => ['masters', id, 'services'] as const,
	portfolio: (id: string) => ['masters', id, 'portfolio'] as const,
	reviews: (id: string) => ['masters', id, 'reviews'] as const,
};

export function useAdminMasters(p: MastersParams) {
	return useQuery({
		queryKey: masterKeys.list(p),
		queryFn: () => http.get<Page<AdminMaster>>('/admin/masters', cleanParams(p)),
		placeholderData: keepPreviousData,
	});
}

/**
 * Document URLs are presigned and expire, so the detail is never served from cache:
 * always refetched on mount and dropped as soon as nothing observes it.
 */
export function useAdminMaster(id: string) {
	return useQuery({
		queryKey: masterKeys.detail(id),
		queryFn: () => http.get<AdminMasterDetail>(`/admin/masters/${id}`),
		staleTime: 0,
		gcTime: 0,
		refetchOnMount: 'always',
	});
}

export function useMasterServices(id: string) {
	return useQuery({
		queryKey: masterKeys.services(id),
		queryFn: () => http.get<PublicMasterService[]>(`/masters/${id}/services`),
	});
}

export function useMasterPortfolio(id: string) {
	return useQuery({
		queryKey: masterKeys.portfolio(id),
		queryFn: () => http.get<PortfolioItem[]>(`/masters/${id}/portfolio`),
		staleTime: 0,
		gcTime: 0,
	});
}

export function useMasterReviews(id: string) {
	return useInfiniteQuery({
		queryKey: masterKeys.reviews(id),
		initialPageParam: 0,
		queryFn: ({ pageParam }) =>
			http.get<Page<PublicReview>>(`/masters/${id}/reviews`, {
				page: pageParam,
				size: 10,
				sort: 'createdAt,DESC',
			}),
		getNextPageParam: last =>
			last.page !== undefined && last.totalPages !== undefined && last.page + 1 < last.totalPages
				? last.page + 1
				: undefined,
	});
}

/**
 * `/admin/masters` has no name filter, so pickers and finance tables use a client-side
 * directory loaded in pages of 100.
 */
export function useMasterDirectory() {
	return useInfiniteQuery({
		queryKey: masterKeys.directory,
		initialPageParam: 0,
		queryFn: ({ pageParam }) =>
			http.get<Page<AdminMaster>>('/admin/masters', { page: pageParam, size: 100 }),
		getNextPageParam: last =>
			last.page !== undefined && last.totalPages !== undefined && last.page + 1 < last.totalPages
				? last.page + 1
				: undefined,
		staleTime: 5 * 60_000,
	});
}

export function masterName(p: Pick<MasterProfile, 'fullName'> | undefined | null, fallback = '—') {
	return p?.fullName?.trim() || fallback;
}

export const masterApi = {
	approve: (id: string) => http.post<MasterProfile>(`/admin/masters/${id}/approve`),
	reject: (id: string, reason: string) =>
		http.post<MasterProfile>(`/admin/masters/${id}/reject`, { reason }),
};
