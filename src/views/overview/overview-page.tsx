'use client';

import { useTranslations } from 'next-intl';
import { useAccess } from '@/entities/user/api';
import { PageHeader } from '@/shared/ui/page-header';
import { KpiCards } from '@/widgets/overview/kpi-cards';
import { ReconciliationWidget } from '@/widgets/overview/reconciliation-widget';
import { RecentComplaints, RecentDisputes } from '@/widgets/overview/recent-activity';

export function OverviewPage() {
	const t = useTranslations('overview');
	const { can } = useAccess();
	return (
		<div className='space-y-8'>
			<PageHeader title={t('title')} description={t('subtitle')} />
			<KpiCards />
			{can('FINANCE') && <ReconciliationWidget />}
			<div className='grid gap-4 lg:grid-cols-2'>
				{can('ORDERS') && <RecentDisputes />}
				{can('COMPLAINTS') && <RecentComplaints />}
			</div>
		</div>
	);
}
