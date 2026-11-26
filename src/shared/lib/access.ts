import type { AdminPermission, UserResponse } from '@/shared/api/types';

/** A backend permission, or the super-admin-only area (Admins). */
export type Access = AdminPermission | 'SUPER_ADMIN';

type Who = Pick<UserResponse, 'roles' | 'permissions'> | null | undefined;

export const isSuperAdmin = (u: Who) => Boolean(u?.roles?.includes('SUPER_ADMIN'));

/** ADMIN or SUPER_ADMIN may hold an admin-panel session. */
export const isAdmin = (u: Who) =>
	Boolean(u?.roles?.some(r => r === 'ADMIN' || r === 'SUPER_ADMIN'));

/** True when the user has every listed access. A super admin has all of them. */
export function hasAccess(u: Who, ...need: Access[]) {
	if (isSuperAdmin(u)) return true;
	return need.every(a => a !== 'SUPER_ADMIN' && Boolean(u?.permissions?.includes(a)));
}
