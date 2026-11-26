'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CircleCheckIcon, RotateCcwIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { DEAD_EVENTS_LIMIT, systemApi, useDeadEvents } from '@/entities/system';
import { useMutationErrorHandler } from '@/shared/api/use-mutation-error';
import { formatDate } from '@/shared/lib/format';
import { Button } from '@/shared/ui/kit/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/kit/card';
import { Skeleton } from '@/shared/ui/kit/skeleton';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/shared/ui/kit/table';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { CopyId } from '@/shared/ui/copy-id';
import { ErrorState } from '@/shared/ui/error-state';

/** GET /admin/outbox/dead + POST /admin/outbox/dead/retry (re-queue all). */
export function DeadEventsCard() {
	const t = useTranslations('system');
	const tc = useTranslations('common');
	const qc = useQueryClient();
	const onError = useMutationErrorHandler();
	const q = useDeadEvents();
	const [open, setOpen] = useState(false);
	const events = q.data ?? [];

	return (
		<Card className='lg:col-span-2'>
			<CardHeader>
				<div className='space-y-1'>
					<CardTitle>{t('outbox')}</CardTitle>
					<CardDescription>{t('outboxDescription')}</CardDescription>
				</div>
				<div className='flex gap-2'>
					<Button variant='ghost' size='xs' onClick={() => q.refetch()} disabled={q.isFetching}>
						{tc('refresh')}
					</Button>
					<Button size='xs' onClick={() => setOpen(true)} disabled={events.length === 0}>
						<RotateCcwIcon /> {t('retry')}
					</Button>
				</div>
			</CardHeader>
			<CardContent className='pt-2'>
				{q.error ? (
					<ErrorState error={q.error} onRetry={() => q.refetch()} className='py-6' />
				) : !q.data ? (
					<Skeleton className='h-32' />
				) : events.length === 0 ? (
					<p className='flex items-center gap-2 py-6 text-sm text-success'>
						<CircleCheckIcon className='size-4' /> {t('outboxEmpty')}
					</p>
				) : (
					<>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{t('eventType')}</TableHead>
									<TableHead>{t('aggregate')}</TableHead>
									<TableHead className='text-right'>{t('attempts')}</TableHead>
									<TableHead>{t('lastError')}</TableHead>
									<TableHead>{t('createdAt')}</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{events.map(e => (
									<TableRow key={e.id}>
										<TableCell className='font-medium'>{e.eventType ?? '—'}</TableCell>
										<TableCell>
											<span className='flex items-center gap-2'>
												<span className='text-muted-foreground'>{e.aggregateType}</span>
												{e.aggregateId && <CopyId id={e.aggregateId} />}
											</span>
										</TableCell>
										<TableCell className='text-right num'>{e.attempts ?? 0}</TableCell>
										<TableCell>
											<span
												className='line-clamp-2 max-w-96 text-xs text-destructive'
												title={e.lastError}
											>
												{e.lastError ?? '—'}
											</span>
										</TableCell>
										<TableCell className='num text-muted-foreground'>
											{formatDate(e.createdAt)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
						{events.length >= DEAD_EVENTS_LIMIT && (
							<p className='pt-3 text-xs text-muted-foreground'>
								{t('outboxLimited', { count: DEAD_EVENTS_LIMIT })}
							</p>
						)}
					</>
				)}
				<ConfirmDialog
					open={open}
					onOpenChange={setOpen}
					title={t('retryTitle')}
					description={t('retryDescription')}
					confirmLabel={t('retry')}
					onConfirm={() =>
						systemApi.retryDead().then(
							res => {
								const total = Object.values(res ?? {}).reduce((s, n) => s + n, 0);
								toast.success(t('retriedToast', { count: total }));
								return qc.invalidateQueries({ queryKey: ['admin', 'outbox'] });
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
