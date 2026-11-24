'use client';

import { useTranslations } from 'next-intl';
import { useServices } from '@/entities/catalog/api';
import { localized } from '@/entities/catalog/model';
import { useAdminOrders } from '@/entities/order/api';
import { MasterPicker } from '@/features/select-master/master-picker';
import { ENUMS, type OrderStatus } from '@/shared/api/types';
import { useLocale } from '@/shared/i18n/locale';
import { useEnumLabel } from '@/shared/i18n/use-enum';
import { shortId } from '@/shared/lib/format';
import { useTableParams } from '@/shared/lib/use-table-params';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/kit/tabs';
import { FilterBar, FilterChip, FilterSelect } from '@/shared/ui/filter-bar';
import { PageHeader } from '@/shared/ui/page-header';
import { OrdersTable } from '@/widgets/order-list/orders-table';

export function OrdersPage() {
	const t = useTranslations('orders');
	const tc = useTranslations('common');
	const label = useEnumLabel();
	const locale = useLocale();
	const tp = useTableParams({
		filters: ['status', 'serviceId', 'masterId', 'customerId'] as const,
		defaultSort: 'createdAt,DESC',
	});
	const services = useServices();

	const q = useAdminOrders({
		status: tp.apiFilters.status as OrderStatus | undefined,
		serviceId: tp.apiFilters.serviceId,
		masterId: tp.apiFilters.masterId,
		customerId: tp.apiFilters.customerId,
		page: tp.page,
		size: tp.size,
		sort: tp.sort,
	});

	const isDisputes = tp.filters.status === 'DISPUTED';

	return (
		<div className='space-y-6'>
			<PageHeader title={t('title')} />
			<Tabs
				value={isDisputes ? 'DISPUTED' : 'ALL'}
				onValueChange={v => tp.setFilter('status', v === 'DISPUTED' ? v : undefined)}
			>
				<TabsList>
					<TabsTrigger value='ALL'>{tc('all')}</TabsTrigger>
					<TabsTrigger value='DISPUTED'>{t('disputes')}</TabsTrigger>
				</TabsList>
			</Tabs>
			<FilterBar>
				<FilterSelect
					value={tp.filters.status}
					onChange={v => tp.setFilter('status', v)}
					allLabel={`${t('status')}: ${tc('all')}`}
					options={ENUMS.orderStatus.map(s => ({ value: s, label: label('OrderStatus', s) }))}
				/>
				<FilterSelect
					value={tp.filters.serviceId}
					onChange={v => tp.setFilter('serviceId', v)}
					allLabel={t('allServices')}
					options={(services.data ?? []).map(s => ({
						value: s.id!,
						label: localized(s.name, locale),
					}))}
				/>
				<MasterPicker
					value={tp.filters.masterId}
					onChange={v => tp.setFilter('masterId', v)}
					allowClear
					placeholder={`${t('filterMaster')}: ${tc('all')}`}
				/>
				{tp.filters.customerId && (
					<FilterChip
						label={`${t('filterCustomer')}: ${shortId(tp.filters.customerId)}`}
						onClear={() => tp.setFilter('customerId', undefined)}
					/>
				)}
			</FilterBar>
			<OrdersTable
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
