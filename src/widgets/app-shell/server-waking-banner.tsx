'use client';

import { LoaderCircleIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useServerWaking } from '@/shared/api/server-status';

export function ServerWakingBanner() {
	const t = useTranslations('errors');
	const waking = useServerWaking();
	if (!waking) return null;
	return (
		<div
			role='status'
			className='flex items-center gap-3 bg-[#0a0b0d] px-6 py-2.5 text-sm text-white'
		>
			<LoaderCircleIcon className='size-4 animate-spin' />
			<span className='font-medium'>{t('serverWaking')}</span>
			<span className='hidden text-white/60 sm:inline'>{t('serverWakingHint')}</span>
		</div>
	);
}
