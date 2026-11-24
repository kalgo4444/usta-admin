'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CalendarCheckIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { financeApi } from '@/entities/finance/api';
import { invalidate } from '@/shared/api/invalidate';
import { useMutationErrorHandler } from '@/shared/api/use-mutation-error';
import { Button } from '@/shared/ui/kit/button';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';

export function CloseWeeksButton() {
	const t = useTranslations('finance');
	const qc = useQueryClient();
	const onError = useMutationErrorHandler();
	const [open, setOpen] = useState(false);

	return (
		<>
			<Button variant='secondary' onClick={() => setOpen(true)}>
				<CalendarCheckIcon /> {t('closeWeeks')}
			</Button>
			<ConfirmDialog
				open={open}
				onOpenChange={setOpen}
				title={t('closeWeeksTitle')}
				description={t('closeWeeksDescription')}
				confirmLabel={t('closeWeeks')}
				onConfirm={() =>
					financeApi.closeWeeks().then(
						res => {
							const entries = Object.entries(res ?? {});
							toast.success(t('closedToast'), {
								description: entries.length
									? entries.map(([k, v]) => `${k}: ${v}`).join(' · ')
									: t('nothingClosed'),
							});
							return invalidate(qc, ['admin', 'finance']);
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
