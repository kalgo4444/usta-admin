'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CircleAlertIcon, StarIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { masterName, useAdminMaster } from '@/entities/master';
import { useAdminOrders } from '@/entities/order';
import { useAccess } from '@/entities/user';
import { MasterVerificationActions } from '@/features/verify-master';
import { routes, withQuery } from '@/shared/config/routes';
import { formatDate } from '@/shared/lib/format';
import { BackLink } from '@/shared/ui/back-link';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/kit/card';
import { DetailSkeleton } from '@/shared/ui/detail-skeleton';
import { ErrorState } from '@/shared/ui/error-state';
import { InfoRow } from '@/shared/ui/page-header';
import { PhoneText } from '@/shared/ui/phone-text';
import { StatusBadge } from '@/shared/ui/status-badge';
import {
	DocumentsGallery,
	LocationMap,
	MasterAvatar,
	MasterPortfolio,
	MasterReviews,
	MasterServices,
} from '@/widgets/master-detail';
import { OrdersTable } from '@/widgets/order-list';

export function MasterDetailPage() {
	const { id } = useParams<{ id: string }>();
	const t = useTranslations('masters');
	const tc = useTranslations('common');
	const tn = useTranslations('nav');
	const q = useAdminMaster(id);
	const { can } = useAccess();
	const [ordersPage, setOrdersPage] = useState(0);
	const orders = useAdminOrders(
		{
			masterId: id,
			page: ordersPage,
			size: 10,
			sort: 'createdAt,DESC',
		},
		can('ORDERS'),
	);

	if (q.error) {
		return (
			<div className='space-y-6'>
				<BackLink href={routes.masters}>{tn('masters')}</BackLink>
				<ErrorState error={q.error} onRetry={() => q.refetch()} />
			</div>
		);
	}
	if (!q.data) return <DetailSkeleton />;

	const { profile, phone, documents = [] } = q.data;
	const name = masterName(profile, t('unnamed'));

	return (
		<div className='space-y-6'>
			<BackLink href={routes.masters}>{tn('masters')}</BackLink>

			<div className='flex flex-wrap items-center justify-between gap-4'>
				<div className='flex items-center gap-4'>
					<MasterAvatar
						url={profile?.avatarUrl}
						name={profile?.fullName}
						size={64}
						className='text-lg'
					/>
					<div className='space-y-1.5'>
						<h1 className='text-[32px] leading-[1.13] font-normal tracking-[-0.4px]'>{name}</h1>
						<div className='flex flex-wrap items-center gap-2 text-sm text-muted-foreground'>
							<StatusBadge kind='VerificationStatus' value={profile?.verificationStatus} />
							<PhoneText phone={phone} />
							{profile?.ratingCount ? (
								<span className='inline-flex items-center gap-1 num'>
									<StarIcon className='size-3.5 fill-current text-warning' />
									{(profile.ratingAvg ?? 0).toFixed(1)} ({profile.ratingCount})
								</span>
							) : null}
						</div>
					</div>
				</div>
				<div className='flex flex-wrap gap-2'>
					<MasterVerificationActions id={id} profile={profile} />
				</div>
			</div>

			{profile?.verificationStatus === 'REJECTED' && profile.rejectionReason && (
				<div className='flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm'>
					<CircleAlertIcon className='mt-0.5 size-4 shrink-0 text-destructive' />
					<div>
						<p className='font-semibold text-destructive'>{t('rejectionReason')}</p>
						<p className='text-foreground'>{profile.rejectionReason}</p>
					</div>
				</div>
			)}

			<div className='grid gap-4 lg:grid-cols-3'>
				<Card className='lg:col-span-2'>
					<CardHeader>
						<CardTitle>{t('documents')}</CardTitle>
						<span className='num text-sm text-muted-foreground'>{documents.length}</span>
					</CardHeader>
					<CardContent>
						<DocumentsGallery documents={documents} />
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>{t('profile')}</CardTitle>
					</CardHeader>
					<CardContent className='pt-2'>
						<dl className='divide-y divide-border-soft'>
							<InfoRow label={t('experience')}>
								{profile?.experienceYears !== undefined
									? t('years', { count: profile.experienceYears })
									: '—'}
							</InfoRow>
							<InfoRow label={t('workRadius')}>
								{profile?.workRadiusKm ? tc('km', { value: profile.workRadiusKm }) : '—'}
							</InfoRow>
							<InfoRow label={t('active')}>{profile?.active ? tc('yes') : tc('no')}</InfoRow>
							<InfoRow label={t('submittedAt')}>
								<span className='num'>{formatDate(profile?.submittedAt)}</span>
							</InfoRow>
							<InfoRow label={t('verifiedAt')}>
								<span className='num'>{formatDate(profile?.verifiedAt)}</span>
							</InfoRow>
							<InfoRow label={t('createdAt')}>
								<span className='num'>{formatDate(profile?.createdAt)}</span>
							</InfoRow>
						</dl>
						{profile?.bio && (
							<div className='mt-4 space-y-1'>
								<p className='text-sm text-muted-foreground'>{t('bio')}</p>
								<p className='text-sm whitespace-pre-line'>{profile.bio}</p>
							</div>
						)}
						{can('FINANCE') && (
							<div className='mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold'>
								<Link href={withQuery(routes.ledger, { masterId: id })} className='text-primary'>
									{t('ledger')}
								</Link>
								<Link
									href={withQuery(routes.commissions, { masterId: id })}
									className='text-primary'
								>
									{t('commissions')}
								</Link>
								<Link href={withQuery(routes.invoices, { masterId: id })} className='text-primary'>
									{tn('invoices')}
								</Link>
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			<div className='grid gap-4 lg:grid-cols-3'>
				<Card>
					<CardHeader>
						<CardTitle>{t('location')}</CardTitle>
					</CardHeader>
					<CardContent>
						<LocationMap location={profile?.workLocation} radiusKm={profile?.workRadiusKm} />
					</CardContent>
				</Card>
				<MasterServices id={id} />
				<MasterPortfolio id={id} />
			</div>

			<div className='grid gap-4 lg:grid-cols-3'>
				{can('ORDERS') && (
					<div className='space-y-3 lg:col-span-2'>
						<div className='flex items-center justify-between'>
							<h2 className='text-lg font-semibold'>{t('relatedOrders')}</h2>
							<Link
								href={withQuery(routes.orders, { masterId: id })}
								className='text-sm font-semibold text-primary'
							>
								{tn('orders')}
							</Link>
						</div>
						<OrdersTable
							query={orders}
							page={ordersPage}
							size={10}
							onPageChange={setOrdersPage}
							hideMaster
						/>
					</div>
				)}
				<MasterReviews id={id} />
			</div>
		</div>
	);
}
