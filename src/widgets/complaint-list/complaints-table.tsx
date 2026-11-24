'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GavelIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { SortingState } from '@tanstack/react-table';
import type { Complaint, Page } from '@/shared/api/types';
import { routes } from '@/shared/config/routes';
import { formatDate } from '@/shared/lib/format';
import { Badge } from '@/shared/ui/kit/badge';
import { columnHelper, DataTable } from '@/shared/ui/data-table';
import { CopyId } from '@/shared/ui/copy-id';
import { StatusBadge } from '@/shared/ui/status-badge';

const col = columnHelper<Complaint>();

export function ComplaintsTable({
	query,
	page,
	size,
	onPageChange,
	onSizeChange,
	sorting,
	onSortingChange,
	hideOrder,
}: {
	query: { data?: Page<Complaint>; isFetching: boolean; error: unknown; refetch: () => unknown };
	page: number;
	size: number;
	onPageChange: (p: number) => void;
	onSizeChange?: (s: number) => void;
	sorting?: SortingState;
	onSortingChange?: (s: SortingState) => void;
	hideOrder?: boolean;
}) {
	const t = useTranslations('complaints');
	const tn = useTranslations('orders');
	const router = useRouter();

	const columns = [
		col.accessor('reason', {
			header: t('reason'),
			cell: c => <StatusBadge kind='ComplaintReason' value={c.getValue()} />,
		}),
		col.accessor('dispute', {
			header: t('dispute'),
			cell: c =>
				c.getValue() ? (
					<Badge tone='red'>
						<GavelIcon /> {t('dispute')}
					</Badge>
				) : null,
		}),
		col.accessor('description', {
			header: tn('description'),
			cell: c => (
				<span className='line-clamp-1 max-w-64 text-muted-foreground'>{c.getValue() ?? '—'}</span>
			),
		}),
		...(hideOrder
			? []
			: [
					col.accessor('orderId', {
						header: t('order'),
						cell: c =>
							c.getValue() ? (
								<Link
									href={routes.order(c.getValue()!)}
									onClick={e => e.stopPropagation()}
									className='text-primary'
								>
									<CopyId id={c.getValue()} className='text-primary' />
								</Link>
							) : (
								'—'
							),
					}),
				]),
		col.accessor('authorId', { header: t('author'), cell: c => <CopyId id={c.getValue()} /> }),
		col.accessor('againstUserId', {
			header: t('against'),
			cell: c => <CopyId id={c.getValue()} />,
		}),
		col.accessor('status', {
			header: t('status'),
			cell: c => <StatusBadge kind='ComplaintStatus' value={c.getValue()} />,
		}),
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
			onRowClick={r => router.push(routes.complaint(r.id!))}
			emptyText={hideOrder ? tn('noComplaints') : undefined}
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
