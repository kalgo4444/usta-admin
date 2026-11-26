'use client';

import Link from 'next/link';
import { ArrowUpRightIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useQueries } from '@tanstack/react-query';
import { ACTIVE_ORDER_STATUSES } from '@/entities/order/api';
import { DEAD_EVENTS_LIMIT, useCount, useDeadEvents } from '@/entities/system/api';
import { useAccess } from '@/entities/user/api';
import { http } from '@/shared/api/client';
import type { Page } from '@/shared/api/types';
import { routes, withQuery } from '@/shared/config/routes';
import type { Access } from '@/shared/lib/access';
import { cn } from '@/shared/lib/utils';
import { Skeleton } from '@/shared/ui/kit/skeleton';

type KpiKey =
	| 'pendingMasters'
	| 'disputes'
	| 'openComplaints'
	| 'inReviewComplaints'
	| 'activeOrders'
	| 'blockedUsers'
	| 'deadEvents';

const KPIS: {
	key: KpiKey;
	access: Access;
	path: string;
	params: Record<string, string>;
	href: string;
	alert?: boolean;
}[] = [
	{
		key: 'pendingMasters',
		access: 'MASTERS',
		path: '/admin/masters',
		params: { status: 'PENDING' },
		href: withQuery(routes.masters, { status: 'PENDING' }),
		alert: true,
	},
	{
		key: 'disputes',
		access: 'ORDERS',
		path: '/admin/orders',
		params: { status: 'DISPUTED' },
		href: withQuery(routes.orders, { status: 'DISPUTED' }),
		alert: true,
	},
	{
		key: 'openComplaints',
		access: 'COMPLAINTS',
		path: '/admin/complaints',
		params: { status: 'OPEN' },
		href: withQuery(routes.complaints, { status: 'OPEN' }),
		alert: true,
	},
	{
		key: 'inReviewComplaints',
		access: 'COMPLAINTS',
		path: '/admin/complaints',
		params: { status: 'IN_REVIEW' },
		href: withQuery(routes.complaints, { status: 'IN_REVIEW' }),
	},
	{
		key: 'blockedUsers',
		access: 'USERS',
		path: '/admin/users',
		params: { status: 'BLOCKED' },
		href: withQuery(routes.users, { status: 'BLOCKED' }),
	},
];

function KpiCard({
	label,
	value,
	href,
	loading,
	alert,
	capped,
}: {
	label: string;
	value?: number;
	href: string;
	loading: boolean;
	alert?: boolean;
	/** The value is a lower bound (list was cut at its limit). */
	capped?: boolean;
}) {
	return (
		<Link
			href={href}
			className='group flex flex-col justify-between gap-6 rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-soft'
		>
			<div className='flex items-start justify-between gap-2'>
				<span className='text-sm text-muted-foreground'>{label}</span>
				<ArrowUpRightIcon className='size-4 text-subtle-foreground transition-colors group-hover:text-primary' />
			</div>
			{loading ? (
				<Skeleton className='h-10 w-20' />
			) : (
				<span
					className={cn(
						'num text-[40px] leading-none font-medium tracking-tight',
						alert && value ? 'text-primary' : '',
					)}
				>
					{value ?? '—'}
					{capped && '+'}
				</span>
			)}
		</Link>
	);
}

function CountKpi({ k }: { k: (typeof KPIS)[number] }) {
	const t = useTranslations('overview.kpi');
	const q = useCount(k.path, k.params);
	return (
		<KpiCard label={t(k.key)} value={q.data} href={k.href} loading={q.isLoading} alert={k.alert} />
	);
}

/** Active orders = SEARCHING + ACCEPTED + IN_PROGRESS (one size=1 query per status). */
function ActiveOrdersKpi() {
	const t = useTranslations('overview.kpi');
	const results = useQueries({
		queries: ACTIVE_ORDER_STATUSES.map(status => ({
			queryKey: ['admin', 'count', '/admin/orders', { status }],
			queryFn: () =>
				http
					.get<Page<unknown>>('/admin/orders', { status, size: 1 })
					.then(p => p.totalElements ?? 0),
		})),
	});
	const loading = results.some(r => r.isLoading);
	const value = results.every(r => r.data !== undefined)
		? results.reduce((s, r) => s + (r.data ?? 0), 0)
		: undefined;
	return <KpiCard label={t('activeOrders')} value={value} href={routes.orders} loading={loading} />;
}

/** Dead outbox events (list length, capped at the query limit). */
function DeadEventsKpi() {
	const t = useTranslations('overview.kpi');
	const q = useDeadEvents();
	return (
		<KpiCard
			label={t('deadEvents')}
			value={q.data?.length}
			href={routes.system}
			loading={q.isLoading}
			alert
			capped={q.data?.length === DEAD_EVENTS_LIMIT}
		/>
	);
}

/** Each card only for an admin with its permission (plan §6.1). */
export function KpiCards() {
	const { can } = useAccess();
	const visible = (k: (typeof KPIS)[number]) => can(k.access);
	return (
		<div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
			{KPIS.slice(0, 4)
				.filter(visible)
				.map(k => (
					<CountKpi key={k.key} k={k} />
				))}
			{can('ORDERS') && <ActiveOrdersKpi />}
			{visible(KPIS[4]) && <CountKpi k={KPIS[4]} />}
			{can('SYSTEM') && <DeadEventsKpi />}
		</div>
	);
}
