'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { StarIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAdminComplaints } from '@/entities/complaint/api';
import { useAccess } from '@/entities/user/api';
import { useAdminOrder } from '@/entities/order/api';
import { ResolveDisputeDialog } from '@/features/resolve-dispute/resolve-dispute-dialog';
import { routes, withQuery } from '@/shared/config/routes';
import { formatDate } from '@/shared/lib/format';
import { BackLink } from '@/shared/ui/back-link';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/kit/card';
import { CopyId } from '@/shared/ui/copy-id';
import { DetailSkeleton } from '@/shared/ui/detail-skeleton';
import { ErrorState } from '@/shared/ui/error-state';
import { MoneyText } from '@/shared/ui/money-text';
import { InfoRow } from '@/shared/ui/page-header';
import { PhoneText } from '@/shared/ui/phone-text';
import { StatusBadge } from '@/shared/ui/status-badge';
import { ComplaintsTable } from '@/widgets/complaint-list/complaints-table';
import { MasterAvatar } from '@/widgets/master-detail/master-avatar';
import { Attachments } from '@/widgets/order-detail/attachments';
import { ChatViewer } from '@/widgets/order-detail/chat-viewer';
import { OffersTable } from '@/widgets/order-detail/offers-table';
import { OrderTimeline } from '@/widgets/order-detail/order-timeline';

export function OrderDetailPage() {
	const { id } = useParams<{ id: string }>();
	const t = useTranslations('orders');
	const tn = useTranslations('nav');
	const tu = useTranslations('users');
	const q = useAdminOrder(id);
	const [cPage, setCPage] = useState(0);
	const { can } = useAccess();
	const complaints = useAdminComplaints(
		{
			orderId: id,
			page: cPage,
			size: 5,
			sort: 'createdAt,DESC',
		},
		can('COMPLAINTS'),
	);

	if (q.error) {
		return (
			<div className='space-y-6'>
				<BackLink href={routes.orders}>{tn('orders')}</BackLink>
				<ErrorState error={q.error} onRetry={() => q.refetch()} />
			</div>
		);
	}
	if (!q.data?.order) return <DetailSkeleton />;

	const { order, customer, commissionAmount, offers = [] } = q.data;
	const master = order.master;

	return (
		<div className='space-y-6'>
			<BackLink href={routes.orders}>{tn('orders')}</BackLink>

			<div className='flex flex-wrap items-end justify-between gap-4'>
				<div className='space-y-2'>
					<div className='flex items-center gap-2'>
						<StatusBadge kind='OrderStatus' value={order.status} />
						<CopyId id={order.id} />
					</div>
					<h1 className='text-[32px] leading-[1.13] font-normal tracking-[-0.4px]'>
						{order.serviceName ?? '—'}
					</h1>
				</div>
				{order.status === 'DISPUTED' && <ResolveDisputeDialog order={order} />}
			</div>

			<div className='grid gap-4 lg:grid-cols-3'>
				<Card className='lg:col-span-2'>
					<CardHeader>
						<CardTitle>{t('details')}</CardTitle>
					</CardHeader>
					<CardContent className='grid gap-x-8 pt-2 md:grid-cols-2'>
						<dl className='divide-y divide-border-soft'>
							<InfoRow label={t('address')}>
								{order.address?.address ?? '—'}
								{order.address?.details && (
									<span className='block text-xs text-muted-foreground'>
										{order.address.details}
									</span>
								)}
							</InfoRow>
							<InfoRow label={t('scheduledAt')}>
								<span className='num'>{formatDate(order.scheduledAt)}</span>
							</InfoRow>
							<InfoRow label={t('priceFrom')}>
								<MoneyText value={order.priceFrom} />
							</InfoRow>
							<InfoRow label={t('price')}>
								<MoneyText value={order.price} className='font-semibold' />
							</InfoRow>
							<InfoRow label={t('commission')}>
								<MoneyText value={commissionAmount} />
							</InfoRow>
						</dl>
						<dl className='divide-y divide-border-soft'>
							<InfoRow label={t('createdAt')}>
								<span className='num'>{formatDate(order.createdAt)}</span>
							</InfoRow>
							<InfoRow label={t('acceptedAt')}>
								<span className='num'>{formatDate(order.acceptedAt)}</span>
							</InfoRow>
							<InfoRow label={t('startedAt')}>
								<span className='num'>{formatDate(order.startedAt)}</span>
							</InfoRow>
							<InfoRow label={t('completedAt')}>
								<span className='num'>{formatDate(order.completedAt)}</span>
							</InfoRow>
							{order.cancelReason && (
								<InfoRow label={t('cancelReason')}>{order.cancelReason}</InfoRow>
							)}
						</dl>
						{order.description && (
							<div className='space-y-1 pt-4 md:col-span-2'>
								<p className='text-sm text-muted-foreground'>{t('description')}</p>
								<p className='text-sm whitespace-pre-line'>{order.description}</p>
							</div>
						)}
					</CardContent>
				</Card>

				<div className='space-y-4'>
					<Card>
						<CardHeader>
							<CardTitle className='text-base'>{t('customer')}</CardTitle>
						</CardHeader>
						<CardContent className='space-y-2 pt-3'>
							<p className='font-medium'>{customer?.fullName ?? '—'}</p>
							<PhoneText phone={customer?.phone} className='text-sm text-muted-foreground' />
							{customer?.id && (
								<div className='flex gap-4 pt-1 text-sm font-semibold'>
									<Link
										href={withQuery(routes.orders, { customerId: customer.id })}
										className='text-primary'
									>
										{tu('orders')}
									</Link>
									{customer.phone && (
										<Link
											href={withQuery(routes.users, { phone: customer.phone })}
											className='text-primary'
										>
											{tn('users')}
										</Link>
									)}
								</div>
							)}
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle className='text-base'>{t('master')}</CardTitle>
						</CardHeader>
						<CardContent className='pt-3'>
							{master?.id ? (
								<Link
									href={routes.master(master.id)}
									className='flex items-center gap-3 hover:opacity-80'
								>
									<MasterAvatar url={master.avatarUrl} name={master.fullName} size={40} />
									<div className='min-w-0'>
										<p className='font-medium text-primary'>{master.fullName ?? '—'}</p>
										<div className='flex items-center gap-2 text-sm text-muted-foreground'>
											<PhoneText phone={master.phone} />
											{master.ratingCount ? (
												<span className='inline-flex items-center gap-0.5 num'>
													<StarIcon className='size-3 fill-current text-warning' />
													{(master.ratingAvg ?? 0).toFixed(1)}
												</span>
											) : null}
										</div>
									</div>
								</Link>
							) : (
								<p className='text-sm text-muted-foreground'>{t('unassigned')}</p>
							)}
						</CardContent>
					</Card>
				</div>
			</div>

			<div className='grid gap-4 lg:grid-cols-3'>
				<Card>
					<CardHeader>
						<CardTitle>{t('timeline')}</CardTitle>
					</CardHeader>
					<CardContent>
						<OrderTimeline
							history={order.history ?? []}
							customerId={customer?.id}
							masterId={master?.id}
						/>
					</CardContent>
				</Card>
				<Card id='chat' className='scroll-mt-24 lg:col-span-2'>
					<CardHeader>
						<CardTitle>{t('chat')}</CardTitle>
					</CardHeader>
					<CardContent>
						<ChatViewer
							orderId={id}
							customerId={customer?.id}
							masterId={master?.id}
							customerName={customer?.fullName}
							masterName={master?.fullName}
						/>
					</CardContent>
				</Card>
			</div>

			{(order.attachments?.length ?? 0) > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>{t('attachments')}</CardTitle>
					</CardHeader>
					<CardContent>
						<Attachments items={order.attachments!} />
					</CardContent>
				</Card>
			)}

			<section className='space-y-3'>
				<h2 className='text-lg font-semibold'>
					{t('offers')} <span className='num text-muted-foreground'>· {offers.length}</span>
				</h2>
				<OffersTable offers={offers} />
			</section>

			{can('COMPLAINTS') && (
				<section className='space-y-3'>
					<h2 className='text-lg font-semibold'>{t('complaints')}</h2>
					<ComplaintsTable
						query={complaints}
						page={cPage}
						size={5}
						onPageChange={setCPage}
						hideOrder
					/>
				</section>
			)}
		</div>
	);
}
