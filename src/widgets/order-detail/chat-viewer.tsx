'use client';

import { useMemo } from 'react';
import { EyeIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useOrderChat } from '@/entities/order/api';
import { formatDate } from '@/shared/lib/format';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/kit/button';
import { Skeleton } from '@/shared/ui/kit/skeleton';
import { ErrorState } from '@/shared/ui/error-state';

/** Read-only order chat. Customer messages on the left, master on the right. */
export function ChatViewer({
	orderId,
	customerId,
	masterId,
	customerName,
	masterName,
}: {
	orderId: string;
	customerId?: string;
	masterId?: string;
	customerName?: string;
	masterName?: string;
}) {
	const t = useTranslations('orders');
	const tc = useTranslations('common');
	const q = useOrderChat(orderId);

	const messages = useMemo(() => {
		const seen = new Set<string>();
		return (q.data?.pages.flat() ?? [])
			.filter(m => (m.id && !seen.has(m.id) ? (seen.add(m.id), true) : false))
			.sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? ''));
	}, [q.data]);

	if (q.error) return <ErrorState error={q.error} onRetry={() => q.refetch()} className='py-6' />;
	if (!q.data) return <Skeleton className='h-48' />;

	return (
		<div className='space-y-3'>
			<p className='flex items-center gap-1.5 text-xs text-muted-foreground'>
				<EyeIcon className='size-3.5' /> {t('chatReadOnly')}
			</p>
			{q.hasNextPage && (
				<div className='flex justify-center'>
					<Button
						variant='secondary'
						size='xs'
						onClick={() => q.fetchNextPage()}
						disabled={q.isFetchingNextPage}
					>
						{q.isFetchingNextPage ? tc('loading') : t('loadOlder')}
					</Button>
				</div>
			)}
			{messages.length === 0 ? (
				<p className='py-8 text-center text-sm text-muted-foreground'>{t('noMessages')}</p>
			) : (
				<div className='max-h-[520px] space-y-2 overflow-y-auto rounded-lg bg-muted p-4'>
					{messages.map(m => {
						const fromMaster = m.senderId === masterId;
						const fromCustomer = m.senderId === customerId;
						return (
							<div
								key={m.id}
								className={cn('flex flex-col', fromMaster ? 'items-end' : 'items-start')}
							>
								<span className='mb-0.5 px-1 text-[11px] text-muted-foreground'>
									{fromMaster
										? (masterName ?? t('master'))
										: fromCustomer
											? (customerName ?? t('customer'))
											: t('bySystem')}
								</span>
								<div
									className={cn(
										'max-w-[80%] rounded-lg px-3.5 py-2 text-sm whitespace-pre-wrap',
										fromMaster
											? 'bg-primary text-primary-foreground'
											: 'border border-border bg-card',
									)}
								>
									{m.imageUrl && (
										<a href={m.imageUrl} target='_blank' rel='noreferrer' className='block'>
											{/* eslint-disable-next-line @next/next/no-img-element -- presigned URL */}
											<img
												src={m.imageUrl}
												alt={t('chatImage')}
												className='max-h-64 rounded-md object-contain'
											/>
										</a>
									)}
									{m.content && (
										<span className={cn(m.imageUrl && 'mt-1.5 block')}>{m.content}</span>
									)}
								</div>
								<span className='mt-0.5 px-1 num text-[11px] text-subtle-foreground'>
									{formatDate(m.createdAt)}
								</span>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
