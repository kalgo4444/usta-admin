'use client';

import { useTranslations } from 'next-intl';
import { useServerMeta } from '@/entities/system';
import { ReindexCard } from '@/features/reindex';
import { DeadEventsCard } from '@/features/retry-outbox';
import { formatDate } from '@/shared/lib/format';
import { Button } from '@/shared/ui/kit/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/kit/card';
import { Skeleton } from '@/shared/ui/kit/skeleton';
import { ErrorState } from '@/shared/ui/error-state';
import { InfoRow, PageHeader } from '@/shared/ui/page-header';

export function SystemPage() {
	const t = useTranslations('system');
	const tc = useTranslations('common');
	const meta = useServerMeta();
	const m = meta.data;

	return (
		<div className='space-y-6'>
			<PageHeader title={t('title')} />
			<div className='grid gap-4 lg:grid-cols-2'>
				<Card>
					<CardHeader>
						<CardTitle>{t('meta')}</CardTitle>
						<Button
							variant='ghost'
							size='xs'
							onClick={() => meta.refetch()}
							disabled={meta.isFetching}
						>
							{tc('refresh')}
						</Button>
					</CardHeader>
					<CardContent className='pt-2'>
						{meta.error ? (
							<ErrorState error={meta.error} onRetry={() => meta.refetch()} className='py-6' />
						) : !m ? (
							<Skeleton className='h-32' />
						) : (
							<dl className='divide-y divide-border-soft'>
								<InfoRow label={t('service')}>{m.service ?? '—'}</InfoRow>
								<InfoRow label={t('version')}>
									<span className='num'>{m.version ?? '—'}</span>
								</InfoRow>
								<InfoRow label={t('serverTime')}>
									<span className='num'>
										{m.serverTime ? `${formatDate(m.serverTime)} (${m.serverTime})` : '—'}
									</span>
								</InfoRow>
								<InfoRow label={t('locale')}>{m.locale ?? '—'}</InfoRow>
								{m.message && <InfoRow label={t('message')}>{m.message}</InfoRow>}
							</dl>
						)}
					</CardContent>
				</Card>
				<ReindexCard />
				<DeadEventsCard />
			</div>
		</div>
	);
}
