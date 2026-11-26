'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Trash2Icon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useAccess, userApi } from '@/entities/user/api';
import { canManageUser } from '@/entities/user/model';
import { invalidate } from '@/shared/api/invalidate';
import type { AdminUser } from '@/shared/api/types';
import { useMutationErrorHandler } from '@/shared/api/use-mutation-error';
import { formatPhone } from '@/shared/lib/format';
import { Button } from '@/shared/ui/kit/button';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';

/**
 * DELETE /admin/users/{id} (USERS + DELETE): irreversible anonymisation, so it asks for a
 * typed confirmation. Business refusals (active orders, debt, …) come back as 409 messages.
 */
export function DeleteUserButton({
	user,
}: {
	user: Pick<AdminUser, 'id' | 'phone' | 'roles' | 'status'>;
}) {
	const t = useTranslations('users');
	const qc = useQueryClient();
	const onError = useMutationErrorHandler();
	const { can, superAdmin, me } = useAccess();
	const [open, setOpen] = useState(false);

	if (!user.id || user.id === me?.id) return null;
	if (!canManageUser(user, { can: can('USERS', 'DELETE'), superAdmin })) return null;
	const id = user.id;

	return (
		<div onClick={e => e.stopPropagation()}>
			<Button
				variant='ghost'
				size='icon-sm'
				className='text-destructive'
				aria-label={t('delete')}
				title={t('delete')}
				onClick={() => setOpen(true)}
			>
				<Trash2Icon />
			</Button>
			<ConfirmDialog
				open={open}
				onOpenChange={setOpen}
				title={t('deleteTitle')}
				description={t('deleteDescription', { phone: formatPhone(user.phone) })}
				destructive
				typeToConfirm='DELETE'
				confirmLabel={t('delete')}
				onConfirm={() =>
					userApi.remove(id).then(
						() => {
							toast.success(t('deletedToast'));
							return invalidate(qc, ['admin', 'users']);
						},
						e => {
							onError(e);
							throw e;
						},
					)
				}
			/>
		</div>
	);
}
