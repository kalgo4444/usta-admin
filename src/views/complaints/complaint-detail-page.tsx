'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { GavelIcon, MessagesSquareIcon, PackageIcon, TriangleAlertIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAdminComplaint } from '@/entities/complaint';
import { useAdminOrder } from '@/entities/order';
import { useAdmins } from '@/entities/admin';
import { useAccess } from '@/entities/user';
import { UserBlockActions } from '@/features/block-user';
import { ComplaintActions } from '@/features/complaint-actions';
import { routes, withQuery } from '@/shared/config/routes';
import { formatDate } from '@/shared/lib/format';
import { BackLink } from '@/shared/ui/back-link';
import { Badge } from '@/shared/ui/kit/badge';
import { Button } from '@/shared/ui/kit/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/kit/card';
import { CopyId } from '@/shared/ui/copy-id';
import { DetailSkeleton } from '@/shared/ui/detail-skeleton';
import { ErrorState } from '@/shared/ui/error-state';
import { InfoRow } from '@/shared/ui/page-header';
import { PhoneText } from '@/shared/ui/phone-text';
import { StatusBadge } from '@/shared/ui/status-badge';
import { ChatViewer } from '@/widgets/order-detail';

export function ComplaintDetailPage() {
	const { id } = useParams<{ id: string }>();
	const t = useTranslations('complaints');
	const tn = useTranslations('nav');
	const to = useTranslations('orders');
	const { me, can, superAdmin } = useAccess();
	const q = useAdminComplaint(id);
	const orderId = q.data?.complaint?.orderId;
	// Order details need ORDERS; COMPLAINTS alone may still read the chat (below).
	const order = useAdminOrder(can('ORDERS') ? orderId : undefined);
	const admins = useAdmins(superAdmin);

	if (q.error) {
		return (
			<div className='space-y-6'>
				<BackLink href={routes.complaints}>{tn('complaints')}</BackLink>
				<ErrorState error={q.error} onRetry={() => q.refetch()} />
			</div>
		);
	}
	if (!q.data?.complaint) return <DetailSkeleton />;

	const data = q.data;
	const c = data.complaint!;
	const o = order.data;
	const customerId = o?.customer?.id;
	const masterId = o?.order?.master?.id;
	const partyName = (uid?: string) =>
		uid && uid === customerId
			? `${o?.customer?.fullName ?? '—'} (${to('customer')})`
			: uid && uid === masterId
				? `${o?.order?.master?.fullName ?? '—'} (${to('master')})`
				: undefined;
	const against = data.complaintsAgainstUser ?? 0;
	const closed = c.status === 'RESOLVED' || c.status === 'REJECTED';

	return (
		<div className='space-y-6'>
			<BackLink href={routes.complaints}>{tn('complaints')}</BackLink>

			<div className='flex flex-wrap items-end justify-between gap-4'>
				<div className='space-y-2'>
					<div className='flex flex-wrap items-center gap-2'>
						<StatusBadge kind='ComplaintStatus' value={c.status} />
						{c.dispute && (
							<Badge tone='red'>
								<GavelIcon /> {t('dispute')}
							</Badge>
						)}
						<CopyId id={c.id} />
					</div>
					<h1 className='text-[32px] leading-[1.13] font-normal tracking-[-0.4px]'>
						<StatusBadge kind='ComplaintReason' value={c.reason} className='px-3 py-1 text-base' />
					</h1>
				</div>
				<div className='flex flex-wrap gap-2'>
					<ComplaintActions
						data={data}
						orderHasPrice={o?.order?.price !== undefined && o?.order?.price !== null}
					/>
				</div>
			</div>

			{against > 2 && (
				<div className='flex items-center gap-3 rounded-lg border border-warning/40 bg-warning/10 p-4 text-sm'>
					<TriangleAlertIcon className='size-4 shrink-0 text-warning' />
					<span className='font-medium'>{t('againstWarning', { count: against })}</span>
					{c.againstUserId && (
						<Link
							href={withQuery(routes.complaints, { againstUserId: c.againstUserId, status: 'ALL' })}
							className='ml-auto font-semibold text-primary'
						>
							{tn('complaints')}
						</Link>
					)}
				</div>
			)}

			<div className='grid gap-4 lg:grid-cols-3'>
				<Card className='lg:col-span-2'>
					<CardHeader>
						<CardTitle>{t('description')}</CardTitle>
					</CardHeader>
					<CardContent className='space-y-6'>
						<p className='text-sm whitespace-pre-line'>{c.description ?? '—'}</p>
						{c.resolutionNote && (
							<div className='rounded-lg bg-muted p-4'>
								<p className='mb-1 text-xs font-semibold text-muted-foreground'>
									{t('resolutionNote')}
								</p>
								<p className='text-sm whitespace-pre-line'>{c.resolutionNote}</p>
							</div>
						)}
						{c.orderId && can('ORDERS') && (
							<div className='flex flex-wrap gap-2'>
								<Button variant='secondary' size='sm' asChild>
									<Link href={routes.order(c.orderId)}>
										<PackageIcon /> {t('openOrder')}
									</Link>
								</Button>
								<Button variant='secondary' size='sm' asChild>
									<Link href={`${routes.order(c.orderId)}#chat`}>
										<MessagesSquareIcon /> {t('openChat')}
									</Link>
								</Button>
							</div>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>{to('details')}</CardTitle>
					</CardHeader>
					<CardContent className='pt-2'>
						<dl className='divide-y divide-border-soft'>
							<InfoRow label={t('orderStatus')}>
								<StatusBadge kind='OrderStatus' value={data.orderStatus} />
							</InfoRow>
							<InfoRow label={t('author')}>
								<span className='flex flex-col'>
									{partyName(c.authorId) && <span>{partyName(c.authorId)}</span>}
									<CopyId id={c.authorId} className='-ml-1 w-fit' />
								</span>
							</InfoRow>
							<InfoRow label={t('against')}>
								<span className='flex flex-col'>
									{partyName(c.againstUserId) && <span>{partyName(c.againstUserId)}</span>}
									<CopyId id={c.againstUserId} className='-ml-1 w-fit' />
								</span>
							</InfoRow>
							<InfoRow label={t('assignedTo')}>
								{data.assignedTo ? (
									data.assignedTo === me?.id ? (
										t('me')
									) : (
										<AssignedAdmin
											id={data.assignedTo}
											phone={admins.data?.find(a => a.id === data.assignedTo)?.phone}
										/>
									)
								) : (
									'—'
								)}
							</InfoRow>
							<InfoRow label={t('createdAt')}>
								<span className='num'>{formatDate(c.createdAt)}</span>
							</InfoRow>
							<InfoRow label={t('resolvedAt')}>
								<span className='num'>{formatDate(c.resolvedAt)}</span>
							</InfoRow>
						</dl>
						{closed && c.againstUserId && (
							<div className='mt-4 flex items-center justify-between gap-2 rounded-lg bg-muted p-3'>
								<span className='text-sm text-muted-foreground'>{t('blockUser')}</span>
								<UserBlockActions
									user={{ id: c.againstUserId, phone: partyName(c.againstUserId) }}
									size='sm'
								/>
							</div>
						)}
					</CardContent>
				</Card>

				{c.orderId && !can('ORDERS') && (
					<Card className='lg:col-span-2'>
						<CardHeader>
							<CardTitle>{to('chat')}</CardTitle>
						</CardHeader>
						<CardContent>
							<ChatViewer orderId={c.orderId} />
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
}

/** Admin phone is only resolvable for a super admin (`/admin/admins`). */
function AssignedAdmin({ id, phone }: { id: string; phone?: string }) {
	if (!phone) return <CopyId id={id} />;
	return <PhoneText phone={phone} />;
}
