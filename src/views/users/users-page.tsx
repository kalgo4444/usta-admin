'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useAdminUsers } from '@/entities/user';
import { UserBlockActions } from '@/features/block-user';
import { DeleteUserButton } from '@/features/delete-user';
import { ENUMS, type AdminUser, type UserRole, type UserStatus } from '@/shared/api/types';
import { routes, withQuery } from '@/shared/config/routes';
import { useEnumLabel } from '@/shared/i18n/use-enum';
import { formatDate } from '@/shared/lib/format';
import { useTableParams } from '@/shared/lib/use-table-params';
import { columnHelper, DataTable } from '@/shared/ui/data-table';
import { FilterBar, FilterSelect, SearchInput } from '@/shared/ui/filter-bar';
import { PageHeader } from '@/shared/ui/page-header';
import { PhoneText } from '@/shared/ui/phone-text';
import { StatusBadge } from '@/shared/ui/status-badge';

const col = columnHelper<AdminUser>();

export function UsersPage() {
	const t = useTranslations('users');
	const label = useEnumLabel();
	const tp = useTableParams({
		filters: ['phone', 'role', 'status'] as const,
		defaultSort: 'createdAt,DESC',
	});

	const q = useAdminUsers({
		phone: tp.apiFilters.phone,
		role: tp.apiFilters.role as UserRole | undefined,
		status: tp.apiFilters.status as UserStatus | undefined,
		page: tp.page,
		size: tp.size,
		sort: tp.sort,
	});

	const columns = [
		col.accessor('phone', {
			header: t('phone'),
			enableSorting: true,
			cell: c => <PhoneText phone={c.getValue()} className='font-medium' />,
		}),
		col.accessor('roles', {
			header: t('roles'),
			cell: c => (
				<div className='flex flex-wrap gap-1'>
					{(c.getValue() ?? []).map(r => (
						<StatusBadge key={r} kind='UserRole' value={r} />
					))}
				</div>
			),
		}),
		col.accessor('status', {
			header: t('status'),
			cell: c => <StatusBadge kind='UserStatus' value={c.getValue()} />,
		}),
		col.accessor('blockedReason', {
			header: t('blockedReason'),
			cell: c => (
				<span className='line-clamp-2 max-w-64 text-muted-foreground'>{c.getValue() || '—'}</span>
			),
		}),
		col.accessor('lastLoginAt', {
			header: t('lastLogin'),
			enableSorting: true,
			cell: c => <span className='num text-muted-foreground'>{formatDate(c.getValue())}</span>,
		}),
		col.accessor('createdAt', {
			header: t('createdAt'),
			enableSorting: true,
			cell: c => <span className='num text-muted-foreground'>{formatDate(c.getValue())}</span>,
		}),
		col.display({
			id: 'actions',
			header: '',
			meta: { className: 'text-right' },
			cell: ({ row }) => {
				const u = row.original;
				return (
					<div className='flex items-center justify-end gap-3'>
						{u.status !== 'DELETED' && u.roles?.includes('MASTER') && (
							<Link
								href={routes.master(u.id!)}
								className='text-xs font-semibold whitespace-nowrap text-primary'
							>
								{t('masterProfile')}
							</Link>
						)}
						{u.roles?.includes('CUSTOMER') && (
							<Link
								href={withQuery(routes.orders, { customerId: u.id })}
								className='text-xs font-semibold whitespace-nowrap text-primary'
							>
								{t('orders')}
							</Link>
						)}
						<UserBlockActions user={u} />
						<DeleteUserButton user={u} />
					</div>
				);
			},
		}),
	];

	return (
		<div className='space-y-6'>
			<PageHeader title={t('title')} />
			<FilterBar>
				<SearchInput
					value={tp.filters.phone}
					onCommit={v => tp.setFilter('phone', v)}
					placeholder={t('searchPhone')}
				/>
				<FilterSelect
					value={tp.filters.role}
					onChange={v => tp.setFilter('role', v)}
					allLabel={t('allRoles')}
					options={ENUMS.userRole.map(r => ({ value: r, label: label('UserRole', r) }))}
				/>
				<FilterSelect
					value={tp.filters.status}
					onChange={v => tp.setFilter('status', v)}
					allLabel={t('allStatuses')}
					options={ENUMS.userStatus.map(s => ({ value: s, label: label('UserStatus', s) }))}
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
