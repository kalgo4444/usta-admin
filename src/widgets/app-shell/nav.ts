import {
	BanknoteIcon,
	BoxesIcon,
	FolderTreeIcon,
	HardHatIcon,
	LayoutGridIcon,
	MessageSquareWarningIcon,
	PackageIcon,
	PercentIcon,
	ReceiptIcon,
	ScaleIcon,
	ServerCogIcon,
	UsersIcon,
	type LucideIcon,
} from 'lucide-react';
import { routes } from '@/shared/config/routes';

type NavKey =
	| 'overview'
	| 'users'
	| 'masters'
	| 'orders'
	| 'complaints'
	| 'categories'
	| 'services'
	| 'invoices'
	| 'commissions'
	| 'ledger'
	| 'reconciliation'
	| 'system';

export interface NavItem {
	key: NavKey;
	href: string;
	icon: LucideIcon;
	/** KPI counter shown as a badge. */
	badge?: 'pendingMasters' | 'disputes' | 'openComplaints';
}

export interface NavGroup {
	key?: 'catalog' | 'finance';
	items: NavItem[];
}

export const NAV: NavGroup[] = [
	{
		items: [
			{ key: 'overview', href: routes.overview, icon: LayoutGridIcon },
			{ key: 'users', href: routes.users, icon: UsersIcon },
			{ key: 'masters', href: routes.masters, icon: HardHatIcon, badge: 'pendingMasters' },
			{ key: 'orders', href: routes.orders, icon: PackageIcon, badge: 'disputes' },
			{
				key: 'complaints',
				href: routes.complaints,
				icon: MessageSquareWarningIcon,
				badge: 'openComplaints',
			},
		],
	},
	{
		key: 'catalog',
		items: [
			{ key: 'categories', href: routes.categories, icon: FolderTreeIcon },
			{ key: 'services', href: routes.services, icon: BoxesIcon },
		],
	},
	{
		key: 'finance',
		items: [
			{ key: 'invoices', href: routes.invoices, icon: ReceiptIcon },
			{ key: 'commissions', href: routes.commissions, icon: PercentIcon },
			{ key: 'ledger', href: routes.ledger, icon: BanknoteIcon },
			{ key: 'reconciliation', href: routes.reconciliation, icon: ScaleIcon },
		],
	},
	{ items: [{ key: 'system', href: routes.system, icon: ServerCogIcon }] },
];

export function isActive(pathname: string, href: string) {
	return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}
