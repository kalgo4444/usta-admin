'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useCommissions } from '@/entities/finance';
import { MasterPicker, useMasterNames } from '@/features/select-master';
import { ENUMS, type Commission, type CommissionStatus } from '@/shared/api/types';
import { routes } from '@/shared/config/routes';
import { useEnumLabel } from '@/shared/i18n/use-enum';
import { formatDate, formatPercent, shortId } from '@/shared/lib/format';
import { useTableParams } from '@/shared/lib/use-table-params';
import { columnHelper, DataTable } from '@/shared/ui/data-table';
import { CopyId } from '@/shared/ui/copy-id';
import { WeekPicker } from '@/shared/ui/date-inputs';
import { FilterBar, FilterSelect } from '@/shared/ui/filter-bar';
import { MoneyText } from '@/shared/ui/money-text';
import { PageHeader } from '@/shared/ui/page-header';
import { StatusBadge } from '@/shared/ui/status-badge';

const col = columnHelper<Commission>();

export function CommissionsPage() {
	const t = useTranslations('finance');
	const tc = useTranslations('common');
	const label = useEnumLabel();
	const names = useMasterNames();
	const tp = useTableParams({
		filters: ['masterId', 'period', 'status'] as const,
		defaultSort: 'createdAt,DESC',
	});
	const q = useCommissions({
		masterId: tp.apiFilters.masterId,
		period: tp.apiFilters.period,
		status: tp.apiFilters.status as CommissionStatus | undefined,
		page: tp.page,
		size: tp.size,
		sort: tp.sort,
	});

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
		col.accessor('baseAmount', {
			header: t('baseAmount'),
			enableSorting: true,
			cell: c => <MoneyText value={c.getValue()} />,
		}),
		col.accessor('ratePercent', {
			header: t('rate'),
			cell: c => <span className='num'>{formatPercent(c.getValue())}</span>,
		}),
		col.accessor('amount', {
			header: t('commission'),
			enableSorting: true,
			cell: c => <MoneyText value={c.getValue()} className='font-semibold' />,
		}),
		col.accessor('period', {
			header: t('period'),
			enableSorting: true,
			cell: c => <span className='num'>{formatDate(c.getValue(), false)}</span>,
		}),
		col.accessor('status', {
			header: t('status'),
			cell: c => <StatusBadge kind='CommissionStatus' value={c.getValue()} />,
		}),
		col.accessor('createdAt', {
			header: t('createdAt'),
			enableSorting: true,
			cell: ({ row }) => (
				<div className='space-y-0.5 num text-xs text-muted-foreground'>
					<div>{formatDate(row.original.createdAt)}</div>
					{row.original.invoicedAt && (
						<div>
							{t('invoicedAt')}: {formatDate(row.original.invoicedAt)}
						</div>
					)}
					{row.original.paidAt && (
						<div>
							{t('paidAt')}: {formatDate(row.original.paidAt)}
						</div>
					)}
				</div>
			),
		}),
	];

	return (
		<div className='space-y-6'>
			<PageHeader title={t('commissions')} />
			<FilterBar>
				<MasterPicker
					value={tp.filters.masterId}
					onChange={v => tp.setFilter('masterId', v)}
					allowClear
					allLabel={t('allMasters')}
					placeholder={t('allMasters')}
				/>
				<WeekPicker
					label={t('period')}
					value={tp.filters.period}
					onChange={v => tp.setFilter('period', v)}
				/>
				<FilterSelect
					value={tp.filters.status}
					onChange={v => tp.setFilter('status', v)}
					allLabel={`${t('status')}: ${tc('all')}`}
					options={ENUMS.commissionStatus.map(s => ({
						value: s,
						label: label('CommissionStatus', s),
					}))}
				/>
			</FilterBar>
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
		</div>
	);
}
