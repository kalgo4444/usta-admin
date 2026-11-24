'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useAdminComplaints } from '@/entities/complaint/api';
import { useAdminOrders } from '@/entities/order/api';
import { routes, withQuery } from '@/shared/config/routes';
import { formatDate } from '@/shared/lib/format';
import { useEnumLabel } from '@/shared/i18n/use-enum';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/kit/card';
import { Skeleton } from '@/shared/ui/kit/skeleton';
import { EmptyState, ErrorState } from '@/shared/ui/error-state';
import { MoneyText } from '@/shared/ui/money-text';
import { StatusBadge } from '@/shared/ui/status-badge';

function ListCard({
	title,
	href,
	loading,
	error,
	onRetry,
	empty,
	children,
}: {
	title: string;
	href: string;
	loading: boolean;
	error: unknown;
	onRetry: () => void;
	empty: boolean;
	children: React.ReactNode;
}) {
	const t = useTranslations('overview');
	return (
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				<Link href={href} className='text-sm font-semibold text-primary'>
					{t('viewAll')}
				</Link>
			</CardHeader>
			<CardContent className='pt-3'>
				{error ? (
					<ErrorState error={error} onRetry={onRetry} className='py-6' />
				) : loading ? (
					<div className='space-y-3'>
						{Array.from({ length: 4 }).map((_, i) => (
							<Skeleton key={i} className='h-10' />
						))}
					</div>
				) : empty ? (
					<EmptyState className='py-8' />
				) : (
					<ul className='divide-y divide-border-soft'>{children}</ul>
				)}
			</CardContent>
		</Card>
	);
}

export function RecentDisputes() {
	const t = useTranslations('overview');
	const q = useAdminOrders({ status: 'DISPUTED', size: 5, sort: 'createdAt,DESC' });
	const items = q.data?.items ?? [];
	return (
		<ListCard
			title={t('recentDisputes')}
			href={withQuery(routes.orders, { status: 'DISPUTED' })}
			loading={q.isLoading}
			error={q.error}
			onRetry={() => q.refetch()}
			empty={items.length === 0}
		>
			{items.map(o => (
				<li key={o.id}>
					<Link
						href={routes.order(o.id!)}
						className='flex items-center justify-between gap-4 py-3 hover:opacity-80'
					>
						<div className='min-w-0'>
							<p className='truncate text-sm font-medium'>{o.serviceName ?? '—'}</p>
							<p className='truncate text-xs text-muted-foreground'>
								{o.masterName ?? '—'} · {formatDate(o.createdAt)}
							</p>
						</div>
						<MoneyText value={o.price ?? o.priceFrom} className='text-sm' />
					</Link>
				</li>
			))}
		</ListCard>
	);
}

export function RecentComplaints() {
	const t = useTranslations('overview');
	const label = useEnumLabel();
	const q = useAdminComplaints({ status: 'OPEN', size: 5, sort: 'createdAt,DESC' });
	const items = q.data?.items ?? [];
	return (
		<ListCard
			title={t('recentComplaints')}
			href={withQuery(routes.complaints, { status: 'OPEN' })}
			loading={q.isLoading}
			error={q.error}
			onRetry={() => q.refetch()}
			empty={items.length === 0}
		>
			{items.map(c => (
				<li key={c.id}>
					<Link
						href={routes.complaint(c.id!)}
						className='flex items-center justify-between gap-4 py-3 hover:opacity-80'
					>
						<div className='min-w-0'>
							<p className='truncate text-sm font-medium'>{label('ComplaintReason', c.reason)}</p>
							<p className='truncate text-xs text-muted-foreground'>
								{c.description ?? '—'} · {formatDate(c.createdAt)}
							</p>
						</div>
						{c.dispute && <StatusBadge kind='OrderStatus' value='DISPUTED' />}
					</Link>
				</li>
			))}
		</ListCard>
	);
}
