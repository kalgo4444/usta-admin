'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { cleanParams, http } from '@/shared/api/client';
import type { AdminUser, Page, UserResponse, UserRole, UserStatus } from '@/shared/api/types';

export interface UsersParams {
	phone?: string;
	role?: UserRole;
	status?: UserStatus;
	page?: number;
	size?: number;
	sort?: string;
}

export const userKeys = {
	me: ['admin', 'me'] as const,
	list: (p: UsersParams) => ['admin', 'users', p] as const,
};

export function useMe() {
	return useQuery({
		queryKey: userKeys.me,
		queryFn: () => http.get<UserResponse>('/me'),
		staleTime: 5 * 60_000,
	});
}

export function useAdminUsers(p: UsersParams) {
	return useQuery({
		queryKey: userKeys.list(p),
		queryFn: () => http.get<Page<AdminUser>>('/admin/users', cleanParams(p)),
		placeholderData: keepPreviousData,
	});
}

export const userApi = {
	block: (id: string, reason: string) =>
		http.post<AdminUser>(`/admin/users/${id}/block`, { reason }),
	unblock: (id: string) => http.post<AdminUser>(`/admin/users/${id}/unblock`),
};
