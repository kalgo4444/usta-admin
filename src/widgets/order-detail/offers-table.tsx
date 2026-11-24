'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { Offer } from '@/shared/api/types';
import { routes } from '@/shared/config/routes';
import { formatDate } from '@/shared/lib/format';
import { columnHelper, DataTable } from '@/shared/ui/data-table';
import { StatusBadge } from '@/shared/ui/status-badge';

const col = columnHelper<Offer>();

export function OffersTable({ offers }: { offers: Offer[] }) {
	const t = useTranslations('orders');
	const tc = useTranslations('common');
	const columns = [
		col.accessor('masterName', {
			header: t('master'),
			cell: ({ row }) =>
				row.original.masterId ? (
					<Link href={routes.master(row.original.masterId)} className='font-medium text-primary'>
						{row.original.masterName ?? '—'}
					</Link>
				) : (
					(row.original.masterName ?? '—')
				),
		}),
		col.accessor('status', {
			header: t('status'),
			cell: c => <StatusBadge kind='OfferStatus' value={c.getValue()} />,
		}),
		col.accessor('distanceMeters', {
			header: t('distance'),
			cell: c => {
				const m = c.getValue();
				if (m === undefined) return '—';
				return (
					<span className='num'>
						{m >= 1000 ? tc('km', { value: (m / 1000).toFixed(1) }) : tc('meters', { value: m })}
					</span>
				);
			},
		}),
		col.accessor('createdAt', {
			header: t('sentAt'),
			cell: c => <span className='num text-muted-foreground'>{formatDate(c.getValue())}</span>,
		}),
		col.accessor('expiresAt', {
			header: t('expiresAt'),
			cell: c => <span className='num text-muted-foreground'>{formatDate(c.getValue())}</span>,
		}),
		col.accessor('respondedAt', {
			header: t('respondedAt'),
			cell: c => <span className='num text-muted-foreground'>{formatDate(c.getValue())}</span>,
		}),
	];
	return (
		<DataTable
			columns={columns}
			data={offers}
			getRowId={(r, i) => `${r.masterId}-${i}`}
			emptyText={t('noOffers')}
			className='rounded-lg'
		/>
	);
}
