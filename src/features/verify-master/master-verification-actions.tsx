'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CheckIcon, XIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { masterApi, masterName } from '@/entities/master/api';
import { invalidate } from '@/shared/api/invalidate';
import type { MasterProfile } from '@/shared/api/types';
import { useMutationErrorHandler } from '@/shared/api/use-mutation-error';
import { Button } from '@/shared/ui/kit/button';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { ReasonDialog } from '@/shared/ui/reason-dialog';

/** Approve (PENDING only) / reject (PENDING or APPROVED, reason ≤1000 with presets). */
export function MasterVerificationActions({
	id,
	profile,
}: {
	id: string;
	profile: MasterProfile | undefined;
}) {
	const t = useTranslations('masters');
	const qc = useQueryClient();
	const onError = useMutationErrorHandler();
	const [open, setOpen] = useState<'approve' | 'reject' | null>(null);
	const status = profile?.verificationStatus;
	const canApprove = status === 'PENDING';
	const canReject = status === 'PENDING' || status === 'APPROVED';
	if (!canApprove && !canReject) return null;

	const presets = [
		t('preset.passport'),
		t('preset.selfie'),
		t('preset.missing'),
		t('preset.certificate'),
		t('preset.profile'),
	];
	const done = () => invalidate(qc, ['admin', 'masters'], ['admin', 'master', id]);
	const fail = (e: unknown) => {
		onError(e);
		throw e;
	};

	return (
		<>
			{canReject && (
				<Button variant='secondary' className='text-destructive' onClick={() => setOpen('reject')}>
					<XIcon /> {t('reject')}
				</Button>
			)}
			{canApprove && (
				<Button onClick={() => setOpen('approve')}>
					<CheckIcon /> {t('approve')}
				</Button>
			)}
			<ConfirmDialog
				open={open === 'approve'}
				onOpenChange={o => setOpen(o ? 'approve' : null)}
				title={t('approveTitle')}
				description={t('approveDescription', { name: masterName(profile, t('unnamed')) })}
				confirmLabel={t('approve')}
				onConfirm={() =>
					masterApi.approve(id).then(() => {
						toast.success(t('approvedToast'));
						return done();
					}, fail)
				}
			/>
			<ReasonDialog
				open={open === 'reject'}
				onOpenChange={o => setOpen(o ? 'reject' : null)}
				title={t('rejectTitle')}
				description={t('rejectDescription')}
				max={1000}
				presets={presets}
				confirmLabel={t('reject')}
				onSubmit={reason =>
					masterApi.reject(id, reason).then(() => {
						toast.success(t('rejectedToast'));
						return done();
					}, fail)
				}
			/>
		</>
	);
}
