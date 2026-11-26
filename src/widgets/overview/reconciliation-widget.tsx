'use client';

import Link from 'next/link';
import { CircleCheckIcon, CircleAlertIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useReconciliation } from '@/entities/finance';
import { routes } from '@/shared/config/routes';
import { formatDate } from '@/shared/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/kit/card';
import { Skeleton } from '@/shared/ui/kit/skeleton';
import { ErrorState } from '@/shared/ui/error-state';
import { MoneyText } from '@/shared/ui/money-text';

export function ReconciliationWidget() {
	const t = useTranslations('overview');
	const tf = useTranslations('finance');
	const q = useReconciliation({});
	const r = q.data;

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t('reconciliation')}</CardTitle>
				<Link href={routes.reconciliation} className='text-sm font-semibold text-primary'>
					{t('viewAll')}
				</Link>
			</CardHeader>
			<CardContent>
				{q.error ? (
					<ErrorState error={q.error} onRetry={() => q.refetch()} className='py-6' />
				) : !r ? (
					<Skeleton className='h-24' />
				) : (
					<div className='space-y-5'>
						<div className='flex items-center gap-3'>
							{r.ok ? (
								<CircleCheckIcon className='size-8 text-success' />
							) : (
								<CircleAlertIcon className='size-8 text-destructive' />
							)}
							<div>
								<p
									className={r.ok ? 'font-semibold text-success' : 'font-semibold text-destructive'}
								>
									{r.ok ? t('reconOk') : t('reconMismatches', { count: r.mismatches?.length ?? 0 })}
								</p>
								<p className='num text-xs text-muted-foreground'>
									{formatDate(r.from, false)} — {formatDate(r.to, false)}
								</p>
							</div>
						</div>
						<dl className='grid grid-cols-2 gap-4 text-sm sm:grid-cols-4'>
							<div>
								<dt className='text-muted-foreground'>{tf('ordersCount')}</dt>
								<dd className='num text-lg'>{r.orders ?? 0}</dd>
							</div>
							<div>
								<dt className='text-muted-foreground'>{tf('totalOrderCommission')}</dt>
								<dd>
									<MoneyText value={r.totalOrderCommission} />
								</dd>
							</div>
							<div>
								<dt className='text-muted-foreground'>{tf('totalReported')}</dt>
								<dd>
									<MoneyText value={r.totalReported} />
								</dd>
							</div>
							<div>
								<dt className='text-muted-foreground'>{tf('totalLedger')}</dt>
								<dd>
									<MoneyText value={r.totalLedger} />
								</dd>
							</div>
						</dl>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
