'use client';

import { ExternalLinkIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { MasterProfile } from '@/shared/api/types';

/** OpenStreetMap embed — no map SDK needed for a single read-only marker. */
export function LocationMap({
	location,
	radiusKm,
}: {
	location: MasterProfile['workLocation'];
	radiusKm?: number;
}) {
	const t = useTranslations('masters');
	const tc = useTranslations('common');
	if (!location) return <p className='text-sm text-muted-foreground'>{t('noLocation')}</p>;
	const { latitude: lat, longitude: lon } = location;
	const d = Math.min(0.5, Math.max(0.01, (radiusKm ?? 2) / 111));
	const bbox = [lon - d, lat - d, lon + d, lat + d].map(n => n.toFixed(5)).join(',');
	const embed = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;
	const link = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=14/${lat}/${lon}`;

	return (
		<div className='space-y-2'>
			<iframe
				title={t('location')}
				src={embed}
				loading='lazy'
				className='aspect-[16/10] w-full rounded-lg border border-border'
				referrerPolicy='no-referrer'
			/>
			<div className='flex items-center justify-between text-xs text-muted-foreground'>
				<span className='num'>
					{lat.toFixed(5)}, {lon.toFixed(5)}
					{radiusKm ? ` · ${tc('km', { value: radiusKm })}` : ''}
				</span>
				<a
					href={link}
					target='_blank'
					rel='noopener noreferrer'
					className='inline-flex items-center gap-1 font-semibold text-primary'
				>
					{t('openMap')} <ExternalLinkIcon className='size-3' />
				</a>
			</div>
		</div>
	);
}
