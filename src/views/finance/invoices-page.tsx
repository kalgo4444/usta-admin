'use client';

import { useState } from 'react';
import Link from 'next/link';
import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { invoiceDebt, useInvoices } from '@/entities/finance';
import { CloseWeeksButton } from '@/features/close-weeks';
import { MasterPicker, useMasterNames } from '@/features/select-master';
import type { Invoice } from '@/shared/api/types';
import { routes } from '@/shared/config/routes';
import { formatDate, shortId } from '@/shared/lib/format';
import { useTableParams } from '@/shared/lib/use-table-params';
import { useOpenedOnce } from '@/shared/lib/use-opened-once';
import { Badge } from '@/shared/ui/kit/badge';
import { Button } from '@/shared/ui/kit/button';
import { columnHelper, DataTable } from '@/shared/ui/data-table';
import { WeekPicker } from '@/shared/ui/date-inputs';
import { FilterBar } from '@/shared/ui/filter-bar';
import { MoneyText } from '@/shared/ui/money-text';
import { PageHeader } from '@/shared/ui/page-header';

/** Loaded on first open: keeps zod + react-hook-form out of the page's initial JS. */
const SettleInvoiceDialog = dynamic(() =>
	import('@/features/settle-invoice').then(m => m.SettleInvoiceDialog),
);

const col = columnHelper<Invoice>();
const isOverdue = (i: Invoice) =>
	invoiceDebt(i) > 0 && Boolean(i.dueDate) && dayjs(i.dueDate).isBefore(dayjs(), 'day');

export function InvoicesPage() {
	const t = useTranslations('finance');
	const tp = useTableParams({ filters: ['period', 'masterId'] as const });
	const q = useInvoices({ period: tp.apiFilters.period, masterId: tp.apiFilters.masterId });
	const names = useMasterNames();
	const [settling, setSettling] = useState<Invoice | null>(null);
	const dialogMounted = useOpenedOnce(settling !== null);
	const nameOf = (id?: string) => (id ? (names.get(id) ?? shortId(id)) : '—');

	const columns = [
		col.accessor('masterId', {
			header: t('master'),
			cell: c =>
				c.getValue() ? (
					<Link href={routes.master(c.getValue()!)} className='font-medium text-primary'>
						{nameOf(c.getValue())}
					</Link>
				) : (
					'—'
				),
		}),
		col.accessor('period', {
			header: t('period'),
			cell: c => <span className='num'>{formatDate(c.getValue(), false)}</span>,
		}),
		col.accessor('orders', {
			header: t('orders'),
			cell: c => <span className='num'>{c.getValue() ?? 0}</span>,
		}),
		col.accessor('accrued', {
			header: t('accrued'),
			cell: c => <MoneyText value={c.getValue()} />,
		}),
		col.accessor('invoiced', {
			header: t('invoiced'),
			cell: c => <MoneyText value={c.getValue()} />,
		}),
		col.accessor('paid', { header: t('paid'), cell: c => <MoneyText value={c.getValue()} /> }),
		col.accessor('onHold', {
			header: t('onHold'),
			cell: c => <MoneyText value={c.getValue()} className='text-muted-foreground' />,
		}),
		col.display({
			id: 'debt',
			header: t('debt'),
			cell: ({ row }) => {
				const d = invoiceDebt(row.original);
				return (
					<MoneyText value={d} className={d > 0 ? 'font-semibold' : 'text-muted-foreground'} />
				);
			},
		}),
		col.accessor('dueDate', {
			header: t('dueDate'),
			cell: ({ row, getValue }) => (
				<span className='flex items-center gap-2'>
					<span className='num'>{formatDate(getValue(), false)}</span>
					{isOverdue(row.original) && <Badge tone='red'>{t('overdue')}</Badge>}
				</span>
			),
		}),
		col.display({
			id: 'actions',
			header: '',
			meta: { className: 'text-right' },
			cell: ({ row }) =>
				(row.original.invoiced ?? 0) > 0 && invoiceDebt(row.original) > 0 ? (
					<Button size='xs' onClick={() => setSettling(row.original)}>
						{t('settle')}
					</Button>
				) : null,
		}),
	];

	return (
		<div className='space-y-6'>
			<PageHeader title={t('invoices')} actions={<CloseWeeksButton />} />
			<FilterBar>
				<WeekPicker
					label={t('period')}
					value={tp.filters.period}
					onChange={v => tp.setFilter('period', v)}
				/>
				<MasterPicker
					value={tp.filters.masterId}
					onChange={v => tp.setFilter('masterId', v)}
					allowClear
					allLabel={t('allMasters')}
					placeholder={t('allMasters')}
				/>
			</FilterBar>
			<DataTable
				columns={columns}
				data={q.data}
				isLoading={q.isFetching}
				error={q.error}
				onRetry={() => q.refetch()}
				getRowId={(r, i) => `${r.masterId}-${r.period}-${i}`}
				rowClassName={r =>
					isOverdue(r) ? 'bg-destructive/[0.04] [&_td]:text-destructive' : undefined
				}
			/>
			{dialogMounted && (
				<SettleInvoiceDialog
					invoice={settling}
					masterLabel={nameOf(settling?.masterId)}
					open={settling !== null}
					onOpenChange={o => !o && setSettling(null)}
				/>
			)}
		</div>
	);
}
