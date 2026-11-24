'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { LogOutIcon, MenuIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { logout } from '@/shared/api/session';
import type { UserResponse } from '@/shared/api/types';
import { routes } from '@/shared/config/routes';
import { formatPhone } from '@/shared/lib/format';
import { PreferencesMenu } from '@/features/preferences/preferences-menu';
import { Button } from '@/shared/ui/kit/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/shared/ui/kit/sheet';
import { Brand, SidebarNav } from './sidebar';

export function Header({ user }: { user: UserResponse }) {
	const t = useTranslations('common');
	const qc = useQueryClient();
	const [menu, setMenu] = useState(false);
	const [pending, setPending] = useState(false);

	return (
		<header className='sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur sm:px-8'>
			<Sheet open={menu} onOpenChange={setMenu}>
				<SheetTrigger asChild>
					<Button variant='ghost' size='icon' className='lg:hidden' aria-label={t('menu')}>
						<MenuIcon />
					</Button>
				</SheetTrigger>
				<SheetContent>
					<SheetTitle className='sr-only'>{t('menu')}</SheetTitle>
					<Brand />
					<div className='flex-1 overflow-y-auto'>
						<SidebarNav onNavigate={() => setMenu(false)} />
					</div>
				</SheetContent>
			</Sheet>
			<div className='flex-1' />
			<PreferencesMenu />
			<div className='hidden items-center gap-2 border-l border-border pl-3 sm:flex'>
				<span className='flex size-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold'>
					A
				</span>
				<span className='num text-sm'>{formatPhone(user.phone)}</span>
			</div>
			<Button
				variant='ghost'
				size='icon-sm'
				aria-label={t('logout')}
				title={t('logout')}
				disabled={pending}
				onClick={async () => {
					setPending(true);
					await logout();
					qc.clear();
					window.location.replace(routes.login);
				}}
			>
				<LogOutIcon />
			</Button>
		</header>
	);
}
