'use client';

import Link from 'next/link';
import { WalletIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTransactions } from '@/entities/finance';
import { MasterPicker } from '@/features/select-master';
import type { Transaction } from '@/shared/api/types';
import { routes } from '@/shared/config/routes';
import { formatDate } from '@/shared/lib/format';
import { useTableParams } from '@/shared/lib/use-table-params';
import { columnHelper, DataTable } from '@/shared/ui/data-table';
import { CopyId } from '@/shared/ui/copy-id';
import { FilterBar } from '@/shared/ui/filter-bar';
import { MoneyText } from '@/shared/ui/money-text';
import { PageHeader } from '@/shared/ui/page-header';
import { StatusBadge } from '@/shared/ui/status-badge';

const col = columnHelper<Transaction>();

export function LedgerPage() {
	const t = useTranslations('finance');
	const tn = useTranslations('nav');
	const tp = useTableParams({ filters: ['masterId'] as const, defaultSort: 'createdAt,DESC' });
	const masterId = tp.apiFilters.masterId;
	const q = useTransactions({
		masterId: masterId ?? '',
		page: tp.page,
		size: tp.size,
		sort: tp.sort,
	});

	const columns = [
		col.accessor('createdAt', {
			header: t('date'),
			enableSorting: true,
			cell: c => <span className='num text-muted-foreground'>{formatDate(c.getValue())}</span>,
		}),
		col.accessor('type', {
			header: t('type'),
			cell: c => <StatusBadge kind='TransactionType' value={c.getValue()} />,
		}),
		col.accessor('amount', {
			header: t('amount'),
			enableSorting: true,
			meta: { className: 'text-right' },
			cell: c => <MoneyText value={c.getValue()} signed className='font-semibold' />,
		}),
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
		col.accessor('reference', {
			header: t('reference'),
			cell: c => <span className='text-muted-foreground'>{c.getValue() || '—'}</span>,
		}),
	];

	return (
		<div className='space-y-6'>
			<PageHeader
				title={t('ledger')}
				actions={
					masterId ? (
						<Link href={routes.master(masterId)} className='text-sm font-semibold text-primary'>
							{tn('masters')} →
						</Link>
					) : undefined
				}
			/>
			<FilterBar>
				<MasterPicker
					value={masterId}
					onChange={v => tp.setFilter('masterId', v)}
					placeholder={t('selectMaster')}
				/>
			</FilterBar>
			{!masterId ? (
				<div className='flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-6 py-16 text-center'>
					<WalletIcon className='size-8 text-subtle-foreground' />
					<p className='text-sm text-muted-foreground'>{t('ledgerHint')}</p>
				</div>
			) : (
				<DataTable
					columns={columns}
					data={q.data?.items}
					isLoading={q.isFetching}
					error={q.error}
					onRetry={() => q.refetch()}
					getRowId={r => r.id!}
					sorting={tp.sorting}
					onSortingChange={tp.setSorting}
					pagination={{
						page: tp.page,
						size: tp.size,
						total: q.data?.totalElements ?? 0,
						totalPages: q.data?.totalPages ?? 0,
						onPageChange: tp.setPage,
						onSizeChange: tp.setSize,
					}}
				/>
			)}
		</div>
	);
}
