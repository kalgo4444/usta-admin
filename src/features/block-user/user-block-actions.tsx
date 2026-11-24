'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { BanIcon, ShieldCheckIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { userApi } from '@/entities/user/api';
import { invalidate } from '@/shared/api/invalidate';
import type { AdminUser } from '@/shared/api/types';
import { useMutationErrorHandler } from '@/shared/api/use-mutation-error';
import { formatPhone } from '@/shared/lib/format';
import { Button } from '@/shared/ui/kit/button';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { ReasonDialog } from '@/shared/ui/reason-dialog';

/** Block (reason ≤500) / unblock. Hidden for ADMIN accounts — the backend forbids it. */
export function UserBlockActions({
	user,
	size = 'xs',
}: {
	user: Pick<AdminUser, 'id' | 'phone' | 'roles' | 'status'>;
	size?: 'xs' | 'sm';
}) {
	const t = useTranslations('users');
	const qc = useQueryClient();
	const onError = useMutationErrorHandler();
	const [open, setOpen] = useState<'block' | 'unblock' | null>(null);

	if (!user.id || user.roles?.includes('ADMIN')) return null;
	const id = user.id;
	const done = () => invalidate(qc, ['admin', 'users'], ['admin', 'complaint']);

	return (
		<div onClick={e => e.stopPropagation()}>
			{user.status === 'BLOCKED' ? (
				<Button variant='secondary' size={size} onClick={() => setOpen('unblock')}>
					<ShieldCheckIcon /> {t('unblock')}
				</Button>
			) : (
				<Button
					variant='secondary'
					size={size}
					className='text-destructive'
					onClick={() => setOpen('block')}
				>
					<BanIcon /> {t('block')}
				</Button>
			)}
			<ReasonDialog
				open={open === 'block'}
				onOpenChange={o => setOpen(o ? 'block' : null)}
				title={t('blockTitle')}
				description={t('blockDescription', { phone: formatPhone(user.phone) })}
				max={500}
				confirmLabel={t('block')}
				onSubmit={reason =>
					userApi.block(id, reason).then(
						() => {
							toast.success(t('blockedToast'));
							return done();
						},
						e => {
							onError(e);
							throw e;
						},
					)
				}
			/>
			<ConfirmDialog
				open={open === 'unblock'}
				onOpenChange={o => setOpen(o ? 'unblock' : null)}
				title={t('unblockTitle')}
				description={t('unblockDescription', { phone: formatPhone(user.phone) })}
				confirmLabel={t('unblock')}
				onConfirm={() =>
					userApi.unblock(id).then(
						() => {
							toast.success(t('unblockedToast'));
							return done();
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
