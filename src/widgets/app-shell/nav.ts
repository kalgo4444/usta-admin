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
	ShieldUserIcon,
	UsersIcon,
	type LucideIcon,
} from 'lucide-react';
import { routes } from '@/shared/config/routes';
import type { Access } from '@/shared/lib/access';

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
	| 'system'
	| 'admins';

export interface NavItem {
	key: NavKey;
	href: string;
	icon: LucideIcon;
	/** Hidden from the menu, and the route refused, without this access. */
	access?: Access;
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
			{ key: 'users', href: routes.users, icon: UsersIcon, access: 'USERS' },
			{
				key: 'masters',
				href: routes.masters,
				icon: HardHatIcon,
				access: 'MASTERS',
				badge: 'pendingMasters',
			},
			{
				key: 'orders',
				href: routes.orders,
				icon: PackageIcon,
				access: 'ORDERS',
				badge: 'disputes',
			},
			{
				key: 'complaints',
				href: routes.complaints,
				icon: MessageSquareWarningIcon,
				access: 'COMPLAINTS',
				badge: 'openComplaints',
			},
		],
	},
	{
		key: 'catalog',
		items: [
			{ key: 'categories', href: routes.categories, icon: FolderTreeIcon, access: 'CATALOG' },
			{ key: 'services', href: routes.services, icon: BoxesIcon, access: 'CATALOG' },
		],
	},
	{
		key: 'finance',
		items: [
			{ key: 'invoices', href: routes.invoices, icon: ReceiptIcon, access: 'FINANCE' },
			{ key: 'commissions', href: routes.commissions, icon: PercentIcon, access: 'FINANCE' },
			{ key: 'ledger', href: routes.ledger, icon: BanknoteIcon, access: 'FINANCE' },
			{ key: 'reconciliation', href: routes.reconciliation, icon: ScaleIcon, access: 'FINANCE' },
		],
	},
	{
		items: [
			{ key: 'system', href: routes.system, icon: ServerCogIcon, access: 'SYSTEM' },
			{ key: 'admins', href: routes.admins, icon: ShieldUserIcon, access: 'SUPER_ADMIN' },
		],
	},
];

/** Section prefixes that aren't menu items but still need access. */
const EXTRA_ACCESS: [string, Access][] = [
	['/catalog', 'CATALOG'],
	['/finance', 'FINANCE'],
];

/** Access the page at `pathname` needs, or undefined when any admin may open it. */
export function requiredAccess(pathname: string): Access | undefined {
	for (const g of NAV)
		for (const i of g.items) if (i.href !== '/' && isActive(pathname, i.href)) return i.access;
	return EXTRA_ACCESS.find(([href]) => isActive(pathname, href))?.[1];
}

export function isActive(pathname: string, href: string) {
	return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}
