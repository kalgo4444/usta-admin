import type { AdminUser } from '@/shared/api/types';

/** Shared by block/unblock and delete: who may act on `target` at all. */
export function canManageUser(
	target: Pick<AdminUser, 'roles' | 'status'>,
	actor: { can: boolean; superAdmin: boolean },
) {
	if (!actor.can || target.status === 'DELETED') return false;
	if (target.roles?.includes('SUPER_ADMIN')) return false;
	if (target.roles?.includes('ADMIN')) return actor.superAdmin;
	return true;
}
