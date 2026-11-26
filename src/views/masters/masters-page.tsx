'use client';

import { useRouter } from 'next/navigation';
import { StarIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { masterName, useAdminMasters } from '@/entities/master';
import type { AdminMaster, VerificationStatus } from '@/shared/api/types';
import { routes } from '@/shared/config/routes';
import { useEnumLabel } from '@/shared/i18n/use-enum';
import { formatDate } from '@/shared/lib/format';
import { ALL, useTableParams } from '@/shared/lib/use-table-params';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/kit/tabs';
import { columnHelper, DataTable } from '@/shared/ui/data-table';
import { MasterAvatar } from '@/widgets/master-detail';
import { PageHeader } from '@/shared/ui/page-header';
import { PhoneText } from '@/shared/ui/phone-text';
import { StatusBadge } from '@/shared/ui/status-badge';

const col = columnHelper<AdminMaster>();
const TABS: (VerificationStatus | typeof ALL)[] = [
	'PENDING',
	'APPROVED',
	'REJECTED',
	'NOT_SUBMITTED',
	ALL,
];

export function MastersPage() {
	const t = useTranslations('masters');
	const tc = useTranslations('common');
	const label = useEnumLabel();
	const router = useRouter();
	const tp = useTableParams({ filters: ['status'] as const, defaults: { status: 'PENDING' } });

	const q = useAdminMasters({
		status: tp.apiFilters.status as VerificationStatus | undefined,
		page: tp.page,
		size: tp.size,
		sort: tp.sort,
	});

	const columns = [
		col.accessor(r => r.profile?.fullName, {
			id: 'fullName',
			header: t('name'),
			cell: ({ row }) => (
				<div className='flex items-center gap-3'>
					<MasterAvatar
						url={row.original.profile?.avatarUrl}
						name={row.original.profile?.fullName}
					/>
					<span className='font-medium'>{masterName(row.original.profile, t('unnamed'))}</span>
				</div>
			),
		}),
		col.accessor('phone', { header: t('phone'), cell: c => <PhoneText phone={c.getValue()} /> }),
		col.accessor(r => r.profile?.experienceYears, {
			id: 'experienceYears',
			header: t('experience'),
			cell: c =>
				c.getValue() !== undefined ? (
					<span className='num'>{t('years', { count: c.getValue()! })}</span>
				) : (
					'—'
				),
		}),
		col.accessor(r => r.profile?.ratingAvg, {
			id: 'ratingAvg',
			header: t('rating'),
			cell: ({ row }) => {
				const p = row.original.profile;
				return p?.ratingCount ? (
					<span className='inline-flex items-center gap-1 num'>
						<StarIcon className='size-3.5 fill-current text-warning' />
						{(p.ratingAvg ?? 0).toFixed(1)}
						<span className='text-muted-foreground'>({p.ratingCount})</span>
					</span>
				) : (
					<span className='text-subtle-foreground'>—</span>
				);
			},
		}),
		col.accessor(r => r.profile?.verificationStatus, {
			id: 'verificationStatus',
			header: t('status'),
			cell: c => <StatusBadge kind='VerificationStatus' value={c.getValue()} />,
		}),
		col.accessor(r => r.profile?.submittedAt, {
			id: 'submittedAt',
			header: t('submittedAt'),
			cell: c => <span className='num text-muted-foreground'>{formatDate(c.getValue())}</span>,
		}),
		col.accessor(r => r.profile?.active, {
			id: 'active',
			header: t('active'),
			cell: c => (
				<span className={c.getValue() ? 'text-success' : 'text-subtle-foreground'}>
					{c.getValue() ? tc('yes') : tc('no')}
				</span>
			),
		}),
	];

	return (
		<div className='space-y-6'>
			<PageHeader title={t('title')} />
			<Tabs value={tp.filters.status ?? ALL} onValueChange={v => tp.setFilter('status', v)}>
				<TabsList>
					{TABS.map(s => (
						<TabsTrigger key={s} value={s}>
							{s === ALL ? tc('all') : label('VerificationStatus', s)}
						</TabsTrigger>
					))}
				</TabsList>
			</Tabs>
			<DataTable
				columns={columns}
				data={q.data?.items}
				isLoading={q.isFetching}
				error={q.error}
				onRetry={() => q.refetch()}
				getRowId={(r, i) => r.profile?.userId ?? String(i)}
				onRowClick={r => r.profile?.userId && router.push(routes.master(r.profile.userId))}
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
