'use client';

import { ArrowRightIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { OrderHistory } from '@/shared/api/types';
import { formatDate } from '@/shared/lib/format';
import { StatusBadge } from '@/shared/ui/status-badge';

export function OrderTimeline({
	history,
	customerId,
	masterId,
}: {
	history: OrderHistory[];
	customerId?: string;
	masterId?: string;
}) {
	const t = useTranslations('orders');
	const items = [...history].sort((a, b) => (a.changedAt ?? '').localeCompare(b.changedAt ?? ''));
	if (!items.length) return <p className='text-sm text-muted-foreground'>{t('noHistory')}</p>;

	const who = (id?: string) =>
		id && id === customerId
			? t('byCustomer')
			: id && id === masterId
				? t('byMaster')
				: t('bySystem');

	return (
		<ol className='relative space-y-5 border-l border-border pl-6'>
			{items.map((h, i) => (
				<li key={i} className='relative'>
					<span
						className={`absolute top-1.5 -left-[29px] size-2.5 rounded-full ring-4 ring-card ${i === items.length - 1 ? 'bg-primary' : 'bg-border'}`}
					/>
					<div className='flex flex-wrap items-center gap-2'>
						{h.from && <StatusBadge kind='OrderStatus' value={h.from} />}
						{h.from && <ArrowRightIcon className='size-3.5 text-subtle-foreground' />}
						<StatusBadge kind='OrderStatus' value={h.to} />
					</div>
					<p className='mt-1 num text-xs text-muted-foreground'>
						{formatDate(h.changedAt)} · {t('changedBy', { who: who(h.changedBy) })}
					</p>
					{h.reason && <p className='mt-1 text-sm'>{h.reason}</p>}
				</li>
			))}
		</ol>
	);
}
