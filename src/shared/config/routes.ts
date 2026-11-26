export const routes = {
	login: '/login',
	overview: '/',
	users: '/users',
	masters: '/masters',
	master: (id: string) => `/masters/${id}`,
	orders: '/orders',
	order: (id: string) => `/orders/${id}`,
	complaints: '/complaints',
	complaint: (id: string) => `/complaints/${id}`,
	categories: '/catalog/categories',
	services: '/catalog/services',
	invoices: '/finance/invoices',
	commissions: '/finance/commissions',
	ledger: '/finance/ledger',
	reconciliation: '/finance/reconciliation',
	system: '/system',
	admins: '/admins',
} as const;

export function withQuery(path: string, query: Record<string, string | number | undefined | null>) {
	const qs = new URLSearchParams();
	for (const [k, v] of Object.entries(query))
		if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
	const s = qs.toString();
	return s ? `${path}?${s}` : path;
}
