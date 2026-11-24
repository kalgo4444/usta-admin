'use client';

import { AlertCircleIcon, LockIcon, SearchXIcon, WifiOffIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toApiError } from '@/shared/api/errors';
import { Button } from '@/shared/ui/kit/button';
import { cn } from '@/shared/lib/utils';

export function ErrorState({
	error,
	onRetry,
	className,
}: {
	error: unknown;
	onRetry?: () => void;
	className?: string;
}) {
	const t = useTranslations('errors');
	const tc = useTranslations('common');
	const e = toApiError(error);

	const view =
		e.status === 403
			? { Icon: LockIcon, title: t('forbidden'), text: t('forbiddenHint') }
			: e.status === 404
				? { Icon: SearchXIcon, title: t('notFound'), text: t('notFoundHint') }
				: e.isNetwork
					? { Icon: WifiOffIcon, title: t('network'), text: t('serverWakingHint') }
					: { Icon: AlertCircleIcon, title: t('title'), text: e.message || t('generic') };

	return (
		<div className={cn('flex flex-col items-center gap-3 px-6 py-14 text-center', className)}>
			<span className='flex size-12 items-center justify-center rounded-full bg-secondary'>
				<view.Icon className='size-5 text-muted-foreground' />
			</span>
			<div className='space-y-1'>
				<p className='font-semibold'>{view.title}</p>
				<p className='max-w-md text-sm text-muted-foreground'>{view.text}</p>
				{(e.code || e.traceId) && (
					<p className='num text-xs text-subtle-foreground'>
						{e.code}
						{e.code && e.traceId ? ' · ' : ''}
						{e.traceId && t('traceId', { id: e.traceId })}
					</p>
				)}
			</div>
			{onRetry && e.status !== 403 && e.status !== 404 && (
				<Button variant='secondary' size='sm' onClick={onRetry}>
					{tc('retry')}
				</Button>
			)}
		</div>
	);
}

export function EmptyState({ text, className }: { text?: string; className?: string }) {
	const tc = useTranslations('common');
	return (
		<div className={cn('px-6 py-14 text-center text-sm text-muted-foreground', className)}>
			{text ?? tc('noData')}
		</div>
	);
}
