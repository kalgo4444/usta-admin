'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { LoaderCircleIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMe, userKeys } from '@/entities/user/api';
import { ApiError, toApiError } from '@/shared/api/errors';
import { logout, sessionStore } from '@/shared/api/session';
import { routes } from '@/shared/config/routes';
import { hasAccess, isAdmin } from '@/shared/lib/access';
import { ErrorState } from '@/shared/ui/error-state';
import { Header } from './header';
import { requiredAccess } from './nav';
import { ServerWakingBanner } from './server-waking-banner';
import { Brand, SidebarNav } from './sidebar';

/**
 * AdminGuard + layout. `GET /me` (which also bootstraps the access token from the
 * refresh cookie) must return an ACTIVE user with the ADMIN or SUPER_ADMIN role; each
 * page then needs its permission (plan §5.4).
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
	const t = useTranslations('auth');
	const te = useTranslations('errors');
	const pathname = usePathname();
	const qc = useQueryClient();
	const me = useMe();
	const user = me.data;
	const denied = user && (!isAdmin(user) || user.status !== 'ACTIVE');
	const need = requiredAccess(pathname);

	useEffect(() => {
		if (denied) void logout().finally(() => window.location.replace(routes.login));
	}, [denied]);

	// A refresh (e.g. after 401 TOKEN_OUTDATED) carries the new permissions: apply them
	// without waiting for /me to go stale.
	useEffect(() => {
		const off = sessionStore.subscribe(() => {
			const next = sessionStore.get()?.user;
			if (next) qc.setQueryData(userKeys.me, next);
		});
		return () => void off();
	}, [qc]);

	if (!user || denied) {
		const err = me.error ? toApiError(me.error) : null;
		return (
			<div className='flex min-h-screen flex-col'>
				<ServerWakingBanner />
				<div className='flex flex-1 items-center justify-center'>
					{err && err.status !== 401 ? (
						<ErrorState error={err} onRetry={() => me.refetch()} />
					) : (
						<p className='flex items-center gap-2 text-sm text-muted-foreground'>
							<LoaderCircleIcon className='size-4 animate-spin' />
							{t('checking')}
						</p>
					)}
				</div>
			</div>
		);
	}

	return (
		<div className='flex min-h-screen'>
			<aside className='sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-sidebar lg:flex'>
				<Brand />
				<div className='flex-1 overflow-y-auto'>
					<SidebarNav />
				</div>
			</aside>
			<div className='flex min-w-0 flex-1 flex-col'>
				<ServerWakingBanner />
				<Header user={user} />
				<main className='mx-auto w-full max-w-[1400px] flex-1 px-4 py-8 sm:px-8'>
					{need && !hasAccess(user, need) ? (
						<ErrorState error={new ApiError({ status: 403, message: te('forbidden') })} />
					) : (
						children
					)}
				</main>
			</div>
		</div>
	);
}
