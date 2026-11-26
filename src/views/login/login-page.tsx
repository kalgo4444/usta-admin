'use client';

import { useTranslations } from 'next-intl';
import { LoginForm } from '@/features/auth-otp';
import { PreferencesMenu } from '@/features/preferences';
import { ServerWakingBanner } from '@/widgets/app-shell';

export function LoginPage() {
	const t = useTranslations('auth');
	return (
		<div className='flex min-h-screen flex-col'>
			<ServerWakingBanner />
			<div className='grid flex-1 lg:grid-cols-[1.1fr_1fr]'>
				<section className='relative hidden flex-col justify-between overflow-hidden bg-[#0a0b0d] p-12 text-white lg:flex'>
					<div className='flex items-center gap-2.5'>
						<span className='flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold'>
							U
						</span>
						<span className='font-semibold'>Usta Admin</span>
					</div>
					<div className='space-y-6'>
						<h1 className='max-w-lg text-[52px] leading-none font-normal tracking-[-1.3px]'>
							Usta Platform
						</h1>
						<div className='grid max-w-md grid-cols-2 gap-3'>
							{['masters', 'orders', 'complaints', 'finance'].map(k => (
								<div key={k} className='rounded-xl bg-[#16181c] p-5'>
									<span className='mb-6 block size-2 rounded-full bg-primary' />
									<NavLabel k={k as 'masters' | 'orders' | 'complaints' | 'finance'} />
								</div>
							))}
						</div>
					</div>
					<p className='text-xs text-white/40'>© Usta Platform</p>
				</section>
				<section className='flex flex-col'>
					<div className='flex justify-end p-4'>
						<PreferencesMenu />
					</div>
					<div className='flex flex-1 items-center justify-center px-6 pb-16'>
						<div className='w-full max-w-sm space-y-8'>
							<div className='space-y-2'>
								<h2 className='text-[32px] leading-[1.13] font-normal tracking-[-0.4px]'>
									{t('title')}
								</h2>
								<p className='text-muted-foreground'>{t('subtitle')}</p>
							</div>
							<LoginForm />
						</div>
					</div>
				</section>
			</div>
		</div>
	);
}

function NavLabel({ k }: { k: 'masters' | 'orders' | 'complaints' | 'finance' }) {
	const t = useTranslations('nav');
	return <span className='text-sm font-medium'>{t(k)}</span>;
}
