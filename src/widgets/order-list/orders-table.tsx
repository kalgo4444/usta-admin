'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { SortingState } from '@tanstack/react-table';
import type { OrderSummary, Page } from '@/shared/api/types';
import { routes } from '@/shared/config/routes';
import { formatDate } from '@/shared/lib/format';
import { columnHelper, DataTable } from '@/shared/ui/data-table';
import { CopyId } from '@/shared/ui/copy-id';
import { MoneyText } from '@/shared/ui/money-text';
import { StatusBadge } from '@/shared/ui/status-badge';

const col = columnHelper<OrderSummary>();

export function OrdersTable({
	query,
	page,
	size,
	onPageChange,
	onSizeChange,
	sorting,
	onSortingChange,
	hideMaster,
}: {
	query: { data?: Page<OrderSummary>; isFetching: boolean; error: unknown; refetch: () => unknown };
	page: number;
	size: number;
	onPageChange: (p: number) => void;
	onSizeChange?: (s: number) => void;
	sorting?: SortingState;
	onSortingChange?: (s: SortingState) => void;
	hideMaster?: boolean;
}) {
	const t = useTranslations('orders');
	const router = useRouter();

	const columns = [
		col.accessor('id', { header: t('id'), cell: c => <CopyId id={c.getValue()} /> }),
		col.accessor('status', {
			header: t('status'),
			cell: c => <StatusBadge kind='OrderStatus' value={c.getValue()} />,
		}),
		col.accessor('serviceName', {
			header: t('service'),
			cell: c => <span className='font-medium'>{c.getValue() ?? '—'}</span>,
		}),
		col.accessor('address', {
			header: t('address'),
			cell: c => (
				<span className='line-clamp-1 max-w-56 text-muted-foreground'>{c.getValue() ?? '—'}</span>
			),
		}),
		col.accessor('scheduledAt', {
			header: t('scheduledAt'),
			enableSorting: true,
			cell: c => <span className='num text-muted-foreground'>{formatDate(c.getValue())}</span>,
		}),
		col.accessor('priceFrom', {
			header: t('priceFrom'),
			cell: c => <MoneyText value={c.getValue()} />,
		}),
		col.accessor('price', {
			header: t('price'),
			enableSorting: true,
			cell: c => <MoneyText value={c.getValue()} />,
		}),
		...(hideMaster
			? []
			: [
					col.accessor('masterName', {
						header: t('master'),
						cell: c =>
							c.getValue() ?? <span className='text-subtle-foreground'>{t('unassigned')}</span>,
					}),
				]),
		col.accessor('createdAt', {
			header: t('createdAt'),
			enableSorting: true,
			cell: c => <span className='num text-muted-foreground'>{formatDate(c.getValue())}</span>,
		}),
	];

	return (
		<DataTable
			columns={columns}
			data={query.data?.items}
			isLoading={query.isFetching}
			error={query.error}
			onRetry={() => query.refetch()}
			getRowId={r => r.id!}
			onRowClick={r => router.push(routes.order(r.id!))}
			rowClassName={r => (r.status === 'DISPUTED' ? 'bg-destructive/[0.03]' : undefined)}
			sorting={sorting}
			onSortingChange={onSortingChange}
			pagination={{
				page,
				size,
				total: query.data?.totalElements ?? 0,
				totalPages: query.data?.totalPages ?? 0,
				onPageChange,
				onSizeChange,
			}}
		/>
	);
}
