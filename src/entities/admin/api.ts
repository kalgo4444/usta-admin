'use client';

import { useQuery } from '@tanstack/react-query';
import { http } from '@/shared/api/client';
import type {
	AdminAccount,
	AdminPermission,
	AppointAdminRequest,
	PermissionOption,
} from '@/shared/api/types';

/** Super-admin only endpoints (`/admin/admins*`). */
export const adminKeys = {
	list: ['admin', 'admins'] as const,
	permissions: ['admin', 'permissions'] as const,
};

export function useAdmins(enabled = true) {
	return useQuery({
		queryKey: adminKeys.list,
		queryFn: () => http.get<AdminAccount[]>('/admin/admins'),
		enabled,
	});
}

/** Permission codes with names in the request language. */
export function usePermissionOptions(enabled = true) {
	return useQuery({
		queryKey: adminKeys.permissions,
		queryFn: () => http.get<PermissionOption[]>('/admin/admins/permissions'),
		staleTime: Infinity,
		enabled,
	});
}

export const adminApi = {
	/** By phone; the account is created if it doesn't exist. */
	appoint: (b: AppointAdminRequest) => http.post<AdminAccount>('/admin/admins', b),
	/** Full replacement; the admin's current token gets 401 TOKEN_OUTDATED at once. */
	setPermissions: (id: string, permissions: AdminPermission[]) =>
		http.put<AdminAccount>(`/admin/admins/${id}`, { permissions }),
	/** Drops the admin role only; CUSTOMER/MASTER roles stay. */
	remove: (id: string) => http.delete(`/admin/admins/${id}`),
};
