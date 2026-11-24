'use client';

import { StarIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMasterPortfolio, useMasterReviews, useMasterServices } from '@/entities/master/api';
import { formatDate, formatMoney } from '@/shared/lib/format';
import { Button } from '@/shared/ui/kit/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/kit/card';
import { Skeleton } from '@/shared/ui/kit/skeleton';
import { ErrorState } from '@/shared/ui/error-state';

export function MasterServices({ id }: { id: string }) {
	const t = useTranslations('masters');
	const q = useMasterServices(id);
	return (
		<Card>
			<CardHeader>
				<CardTitle>{t('services')}</CardTitle>
			</CardHeader>
			<CardContent className='pt-3'>
				{q.error ? (
					<ErrorState error={q.error} onRetry={() => q.refetch()} className='py-4' />
				) : !q.data ? (
					<Skeleton className='h-16' />
				) : q.data.length === 0 ? (
					<p className='text-sm text-muted-foreground'>{t('noServices')}</p>
				) : (
					<ul className='divide-y divide-border-soft'>
						{q.data.map(s => (
							<li
								key={s.serviceId}
								className='flex items-start justify-between gap-4 py-2.5 text-sm'
							>
								<div className='min-w-0'>
									<p className='font-medium'>{s.name}</p>
									{s.description && (
										<p className='line-clamp-2 text-xs text-muted-foreground'>{s.description}</p>
									)}
								</div>
								<span className='num whitespace-nowrap'>
									{t('priceFrom', { price: formatMoney(s.priceFrom) })}
								</span>
							</li>
						))}
					</ul>
				)}
			</CardContent>
		</Card>
	);
}

export function MasterPortfolio({ id }: { id: string }) {
	const t = useTranslations('masters');
	const q = useMasterPortfolio(id);
	return (
		<Card>
			<CardHeader>
				<CardTitle>{t('portfolio')}</CardTitle>
			</CardHeader>
			<CardContent className='pt-3'>
				{q.error ? (
					<ErrorState error={q.error} onRetry={() => q.refetch()} className='py-4' />
				) : !q.data ? (
					<Skeleton className='h-24' />
				) : q.data.length === 0 ? (
					<p className='text-sm text-muted-foreground'>{t('noPortfolio')}</p>
				) : (
					<div className='grid grid-cols-3 gap-2'>
						{q.data.map(p => (
							<a
								key={p.id}
								href={p.url}
								target='_blank'
								rel='noopener noreferrer'
								title={p.description}
								className='aspect-square overflow-hidden rounded-md border border-border bg-muted'
							>
								{p.contentType?.startsWith('image/') ? (
									// eslint-disable-next-line @next/next/no-img-element
									<img src={p.url} alt={p.description ?? ''} className='size-full object-cover' />
								) : (
									<span className='flex size-full items-center justify-center text-xs text-muted-foreground'>
										{p.contentType}
									</span>
								)}
							</a>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

export function MasterReviews({ id }: { id: string }) {
	const t = useTranslations('masters');
	const tc = useTranslations('common');
	const q = useMasterReviews(id);
	const items = q.data?.pages.flatMap(p => p.items ?? []) ?? [];
	return (
		<Card>
			<CardHeader>
				<CardTitle>{t('reviews')}</CardTitle>
				{q.data?.pages[0]?.totalElements !== undefined && (
					<span className='num text-sm text-muted-foreground'>{q.data.pages[0].totalElements}</span>
				)}
			</CardHeader>
			<CardContent className='pt-3'>
				{q.error ? (
					<ErrorState error={q.error} onRetry={() => q.refetch()} className='py-4' />
				) : !q.data ? (
					<Skeleton className='h-24' />
				) : items.length === 0 ? (
					<p className='text-sm text-muted-foreground'>{t('noReviews')}</p>
				) : (
					<ul className='space-y-4'>
						{items.map(r => (
							<li key={r.id} className='space-y-1 text-sm'>
								<div className='flex items-center justify-between gap-2'>
									<span className='font-medium'>{r.authorName ?? '—'}</span>
									<span className='inline-flex items-center gap-0.5 text-warning'>
										{Array.from({ length: 5 }).map((_, i) => (
											<StarIcon
												key={i}
												className={
													i < (r.rating ?? 0) ? 'size-3.5 fill-current' : 'size-3.5 opacity-25'
												}
											/>
										))}
									</span>
								</div>
								{r.comment && <p className='text-muted-foreground'>{r.comment}</p>}
								<p className='num text-xs text-subtle-foreground'>{formatDate(r.createdAt)}</p>
							</li>
						))}
					</ul>
				)}
				{q.hasNextPage && (
					<Button
						variant='secondary'
						size='sm'
						className='mt-4 w-full'
						onClick={() => q.fetchNextPage()}
						disabled={q.isFetchingNextPage}
					>
						{q.isFetchingNextPage ? tc('loading') : tc('next')}
					</Button>
				)}
			</CardContent>
		</Card>
	);
}
