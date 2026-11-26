'use client';

import { useState } from 'react';
import { DatabaseZapIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { systemApi } from '@/entities/system';
import { useMutationErrorHandler } from '@/shared/api/use-mutation-error';
import { Button } from '@/shared/ui/kit/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/kit/card';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';

/** POST /admin/search/reindex behind a two-step confirmation (dialog + typed word). */
export function ReindexCard() {
	const t = useTranslations('system');
	const onError = useMutationErrorHandler();
	const [open, setOpen] = useState(false);
	const [result, setResult] = useState<Record<string, number> | null>(null);

	return (
		<Card>
			<CardHeader>
				<div className='space-y-1'>
					<CardTitle>{t('reindex')}</CardTitle>
					<CardDescription>{t('reindexDescription')}</CardDescription>
				</div>
			</CardHeader>
			<CardContent className='space-y-4'>
				<Button variant='destructive' onClick={() => setOpen(true)}>
					<DatabaseZapIcon /> {t('reindex')}
				</Button>
				{result && (
					<div className='rounded-lg bg-muted p-4'>
						<p className='mb-2 text-xs font-semibold text-muted-foreground'>{t('result')}</p>
						<dl className='grid grid-cols-2 gap-2 text-sm sm:grid-cols-4'>
							{Object.entries(result).map(([k, v]) => (
								<div key={k}>
									<dt className='text-muted-foreground'>{k}</dt>
									<dd className='num text-lg'>{v}</dd>
								</div>
							))}
						</dl>
					</div>
				)}
				<ConfirmDialog
					open={open}
					onOpenChange={setOpen}
					title={t('reindexTitle')}
					description={t('reindexDescription')}
					destructive
					typeToConfirm='REINDEX'
					confirmLabel={t('reindex')}
					onConfirm={() =>
						systemApi.reindex().then(
							res => {
								setResult(res ?? {});
								toast.success(t('reindexDoneToast'));
							},
							e => {
								onError(e);
								throw e;
							},
						)
					}
				/>
			</CardContent>
		</Card>
	);
}
