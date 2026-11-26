'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCount } from '@/entities/system';
import { useAccess } from '@/entities/user';
import { cn } from '@/shared/lib/utils';
import { isActive, NAV, type NavItem } from './nav';

const BADGE_QUERIES = {
	pendingMasters: ['/admin/masters', { status: 'PENDING' }],
	disputes: ['/admin/orders', { status: 'DISPUTED' }],
	openComplaints: ['/admin/complaints', { status: 'OPEN' }],
} as const;

function NavBadge({ kind }: { kind: NonNullable<NavItem['badge']> }) {
	const [path, params] = BADGE_QUERIES[kind];
	const { data } = useCount(path, params);
	if (!data) return null;
	return (
		<span className='ml-auto rounded-pill bg-primary px-2 py-0.5 num text-[11px] leading-none font-semibold text-primary-foreground'>
			{data > 99 ? '99+' : data}
		</span>
	);
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
	const t = useTranslations('nav');
	const pathname = usePathname();
	const { can } = useAccess();
	const groups = NAV.map(g => ({
		...g,
		items: g.items.filter(i => !i.access || can(i.access)),
	})).filter(g => g.items.length > 0);

	return (
		<nav className='flex flex-col gap-6 px-3 py-4'>
			{groups.map((group, gi) => (
				<div key={gi} className='space-y-1'>
					{group.key && (
						<p className='px-3 pb-1 text-[11px] font-semibold tracking-wide text-subtle-foreground uppercase'>
							{t(group.key)}
						</p>
					)}
					{group.items.map(item => {
						const active = isActive(pathname, item.href);
						return (
							<Link
								key={item.key}
								href={item.href}
								onClick={onNavigate}
								aria-current={active ? 'page' : undefined}
								className={cn(
									'flex h-10 items-center gap-3 rounded-pill px-3 text-sm font-medium transition-colors',
									active
										? 'bg-background text-foreground shadow-soft dark:bg-secondary'
										: 'text-muted-foreground hover:bg-secondary hover:text-foreground',
								)}
							>
								<item.icon className={cn('size-4.5', active && 'text-primary')} />
								{t(item.key)}
								{item.badge && <NavBadge kind={item.badge} />}
							</Link>
						);
					})}
				</div>
			))}
		</nav>
	);
}

export function Brand() {
	return (
		<div className='flex h-16 items-center gap-2.5 px-6'>
			<span className='flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground'>
				U
			</span>
			<span className='text-base font-semibold tracking-tight'>
				Usta <span className='font-normal text-muted-foreground'>Admin</span>
			</span>
		</div>
	);
}
