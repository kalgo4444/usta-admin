'use client';

import { useTranslations } from 'next-intl';
import { useAdminComplaints } from '@/entities/complaint';
import type { ComplaintStatus } from '@/shared/api/types';
import { ENUMS } from '@/shared/api/types';
import { useEnumLabel } from '@/shared/i18n/use-enum';
import { shortId } from '@/shared/lib/format';
import { ALL, useTableParams } from '@/shared/lib/use-table-params';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/kit/tabs';
import { FilterBar, FilterChip } from '@/shared/ui/filter-bar';
import { PageHeader } from '@/shared/ui/page-header';
import { ComplaintsTable } from '@/widgets/complaint-list';

export function ComplaintsPage() {
	const t = useTranslations('complaints');
	const tc = useTranslations('common');
	const label = useEnumLabel();
	const tp = useTableParams({
		filters: ['status', 'orderId', 'againstUserId', 'authorId'] as const,
		defaults: { status: 'OPEN' },
		defaultSort: 'createdAt,DESC',
	});

	const q = useAdminComplaints({
		status: tp.apiFilters.status as ComplaintStatus | undefined,
		orderId: tp.apiFilters.orderId,
		againstUserId: tp.apiFilters.againstUserId,
		authorId: tp.apiFilters.authorId,
		page: tp.page,
		size: tp.size,
		sort: tp.sort,
	});

	const chips = (
		[
			['orderId', t('order')],
			['againstUserId', t('against')],
			['authorId', t('author')],
		] as const
	).filter(([k]) => tp.filters[k]);

	return (
		<div className='space-y-6'>
			<PageHeader title={t('title')} />
			<div className='flex flex-wrap items-center gap-3'>
				<Tabs value={tp.filters.status ?? ALL} onValueChange={v => tp.setFilter('status', v)}>
					<TabsList>
						{ENUMS.complaintStatus.map(s => (
							<TabsTrigger key={s} value={s}>
								{label('ComplaintStatus', s)}
							</TabsTrigger>
						))}
						<TabsTrigger value={ALL}>{tc('all')}</TabsTrigger>
					</TabsList>
				</Tabs>
				{chips.length > 0 && (
					<FilterBar>
						{chips.map(([k, l]) => (
							<FilterChip
								key={k}
								label={`${l}: ${shortId(tp.filters[k])}`}
								onClear={() => tp.setFilter(k, undefined)}
							/>
						))}
					</FilterBar>
				)}
			</div>
			<ComplaintsTable
				query={q}
				page={tp.page}
				size={tp.size}
				onPageChange={tp.setPage}
				onSizeChange={tp.setSize}
				sorting={tp.sorting}
				onSortingChange={tp.setSorting}
			/>
		</div>
	);
}
