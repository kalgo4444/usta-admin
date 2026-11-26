'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { UserMinusIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { adminApi, adminKeys } from '@/entities/admin';
import { invalidate } from '@/shared/api/invalidate';
import type { AdminAccount } from '@/shared/api/types';
import { useMutationErrorHandler } from '@/shared/api/use-mutation-error';
import { formatPhone } from '@/shared/lib/format';
import { Button } from '@/shared/ui/kit/button';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';

/** DELETE /admin/admins/{id}: removes admin rights; customer/master roles stay. */
export function RemoveAdminButton({ admin }: { admin: AdminAccount }) {
	const t = useTranslations('admins');
	const qc = useQueryClient();
	const onError = useMutationErrorHandler();
	const [open, setOpen] = useState(false);
	if (!admin.id) return null;
	const id = admin.id;

	return (
		<>
			<Button
				variant='ghost'
				size='icon-sm'
				className='text-destructive'
				title={t('remove')}
				aria-label={t('remove')}
				onClick={() => setOpen(true)}
			>
				<UserMinusIcon />
			</Button>
			<ConfirmDialog
				open={open}
				onOpenChange={setOpen}
				destructive
				title={t('removeTitle')}
				description={t('removeDescription', { phone: formatPhone(admin.phone) })}
				confirmLabel={t('remove')}
				onConfirm={() =>
					adminApi.remove(id).then(
						() => {
							toast.success(t('removedToast'));
							return invalidate(qc, adminKeys.list, ['admin', 'users']);
						},
						e => {
							onError(e);
							throw e;
						},
					)
				}
			/>
		</>
	);
}
