'use client';

import Link from 'next/link';
import dayjs from 'dayjs';
import { CircleAlertIcon, CircleCheckIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useReconciliation } from '@/entities/finance/api';
import { useMasterNames } from '@/features/select-master/master-picker';
import type { Mismatch } from '@/shared/api/types';
import { routes } from '@/shared/config/routes';
import { formatDate, shortId } from '@/shared/lib/format';
import { useTableParams } from '@/shared/lib/use-table-params';
import { cn } from '@/shared/lib/utils';
import { Card, CardContent } from '@/shared/ui/kit/card';
import { Skeleton } from '@/shared/ui/kit/skeleton';
import { columnHelper, DataTable } from '@/shared/ui/data-table';
import { CopyId } from '@/shared/ui/copy-id';
import { DateInput } from '@/shared/ui/date-inputs';
import { ErrorState } from '@/shared/ui/error-state';
import { FilterBar } from '@/shared/ui/filter-bar';
import { MoneyText } from '@/shared/ui/money-text';
import { PageHeader } from '@/shared/ui/page-header';
import { StatusBadge } from '@/shared/ui/status-badge';

const col = columnHelper<Mismatch>();
const eq = (a?: number, b?: number) => Math.abs((a ?? 0) - (b ?? 0)) < 0.005;

/** Highlight a cell whose value disagrees with the order's own commission. */
function Diff({ value, reference }: { value?: number; reference?: number }) {
	const bad = !eq(value, reference);
	return (
		<span
			className={cn(
				'rounded-xs px-1.5 py-0.5',
				bad && 'bg-destructive/10 font-semibold text-destructive',
			)}
		>
			<MoneyText value={value} />
		</span>
	);
}

export function ReconciliationPage() {
	const t = useTranslations('finance');
	const names = useMasterNames();
	const tp = useTableParams({
		filters: ['from', 'to'] as const,
		defaults: {
			from: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
			to: dayjs().add(1, 'day').format('YYYY-MM-DD'),
		},
	});
	const q = useReconciliation({ from: tp.filters.from, to: tp.filters.to });
	const r = q.data;

	const columns = [
		col.accessor('orderId', {
			header: t('order'),
			cell: c =>
				c.getValue() ? (
					<Link href={routes.order(c.getValue()!)}>
						<CopyId id={c.getValue()} className='text-primary' />
					</Link>
				) : (
					'—'
				),
		}),
		col.accessor('masterId', {
			header: t('master'),
			cell: c =>
				c.getValue() ? (
					<Link href={routes.master(c.getValue()!)} className='text-primary'>
						{names.get(c.getValue()!) ?? shortId(c.getValue())}
					</Link>
				) : (
					'—'
				),
		}),
		col.accessor('orderStatus', {
			header: t('orderStatus'),
			cell: c => <StatusBadge kind='OrderStatus' value={c.getValue()} />,
		}),
		col.accessor('orderCommission', {
			header: t('orderCommission'),
			cell: c => <MoneyText value={c.getValue()} />,
		}),
		col.accessor('reportedCommission', {
			header: t('reportedCommission'),
			cell: ({ row }) => (
				<Diff value={row.original.reportedCommission} reference={row.original.orderCommission} />
			),
		}),
		col.accessor('ledgerNet', {
			header: t('ledgerNet'),
			cell: ({ row }) => (
				<Diff value={row.original.ledgerNet} reference={row.original.orderCommission} />
			),
		}),
	];

	const stats = r
		? [
				{ label: t('ordersCount'), node: <span className='num'>{r.orders ?? 0}</span> },
				{ label: t('totalOrderCommission'), node: <MoneyText value={r.totalOrderCommission} /> },
				{
					label: t('totalReported'),
					node: <Diff value={r.totalReported} reference={r.totalOrderCommission} />,
				},
				{
					label: t('totalLedger'),
					node: <Diff value={r.totalLedger} reference={r.totalOrderCommission} />,
				},
			]
		: [];

	return (
		<div className='space-y-6'>
			<PageHeader title={t('reconciliation')} />
			<FilterBar>
				<DateInput
					label={t('from')}
					value={tp.filters.from}
					onChange={v => tp.setFilter('from', v)}
				/>
				<DateInput label={t('to')} value={tp.filters.to} onChange={v => tp.setFilter('to', v)} />
			</FilterBar>

			{q.error ? (
				<ErrorState error={q.error} onRetry={() => q.refetch()} />
			) : !r ? (
				<Skeleton className='h-36 rounded-xl' />
			) : (
				<Card>
					<CardContent className='flex flex-wrap items-center gap-x-10 gap-y-6'>
						<div className='flex items-center gap-3'>
							{r.ok ? (
								<CircleCheckIcon className='size-10 text-success' />
							) : (
								<CircleAlertIcon className='size-10 text-destructive' />
							)}
							<div>
								<p
									className={cn(
										'text-lg font-semibold',
										r.ok ? 'text-success' : 'text-destructive',
									)}
								>
									{r.ok ? t('ok') : t('notOk')}
								</p>
								<p className='num text-xs text-muted-foreground'>
									{formatDate(r.from, false)} — {formatDate(r.to, false)}
								</p>
							</div>
						</div>
						{stats.map(s => (
							<div key={s.label} className='space-y-1'>
								<p className='text-xs text-muted-foreground'>{s.label}</p>
								<div className='text-lg'>{s.node}</div>
							</div>
						))}
					</CardContent>
				</Card>
			)}

			<section className='space-y-3'>
				<h2 className='text-lg font-semibold'>
					{t('mismatches')}{' '}
					{r && <span className='num text-muted-foreground'>· {r.mismatches?.length ?? 0}</span>}
				</h2>
				<DataTable
					columns={columns}
					data={r?.mismatches}
					isLoading={q.isFetching}
					getRowId={(m, i) => `${m.orderId}-${i}`}
					emptyText={t('noMismatches')}
				/>
			</section>
		</div>
	);
}
