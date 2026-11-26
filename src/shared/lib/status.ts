import type { BadgeTone } from '@/shared/ui/kit/badge';

/** One place for every enum → colour mapping (plan §6.4 status colours). */
const TONES: Record<string, Record<string, BadgeTone>> = {
	OrderStatus: {
		CREATED: 'blue',
		SEARCHING: 'blue',
		ACCEPTED: 'amber',
		IN_PROGRESS: 'amber',
		COMPLETED: 'green',
		COMMISSION: 'green',
		REVIEWED: 'green',
		CANCELLED: 'gray',
		EXPIRED: 'gray',
		DISPUTED: 'red',
	},
	VerificationStatus: {
		NOT_SUBMITTED: 'gray',
		PENDING: 'amber',
		APPROVED: 'green',
		REJECTED: 'red',
	},
	UserStatus: { ACTIVE: 'green', BLOCKED: 'red', DELETED: 'gray' },
	UserRole: { CUSTOMER: 'neutral', MASTER: 'blue', ADMIN: 'outline', SUPER_ADMIN: 'amber' },
	AdminPermission: {
		USERS: 'neutral',
		MASTERS: 'neutral',
		CATALOG: 'neutral',
		ORDERS: 'neutral',
		FINANCE: 'neutral',
		COMPLAINTS: 'neutral',
		SYSTEM: 'neutral',
		DELETE: 'red',
	},
	ComplaintStatus: { OPEN: 'blue', IN_REVIEW: 'amber', RESOLVED: 'green', REJECTED: 'gray' },
	ComplaintReason: {
		QUALITY: 'neutral',
		NO_SHOW: 'neutral',
		PRICE: 'neutral',
		BEHAVIOR: 'neutral',
		FRAUD: 'red',
		OTHER: 'neutral',
	},
	OfferStatus: {
		PENDING: 'blue',
		ACCEPTED: 'green',
		REJECTED: 'red',
		EXPIRED: 'gray',
		CANCELLED: 'gray',
	},
	CatalogStatus: { ACTIVE: 'green', INACTIVE: 'gray' },
	CommissionStatus: { ACCRUED: 'blue', INVOICED: 'amber', PAID: 'green', CANCELLED: 'gray' },
	TransactionType: {
		COMMISSION_CHARGE: 'red',
		COMMISSION_REVERSAL: 'green',
		COMMISSION_PAYMENT: 'green',
		ADJUSTMENT: 'neutral',
	},
};

export type EnumName =
	| 'OrderStatus'
	| 'VerificationStatus'
	| 'UserStatus'
	| 'UserRole'
	| 'AdminPermission'
	| 'ComplaintStatus'
	| 'ComplaintReason'
	| 'OfferStatus'
	| 'CatalogStatus'
	| 'CommissionStatus'
	| 'TransactionType';

export function statusTone(kind: EnumName, value: string | null | undefined): BadgeTone {
	return (value && TONES[kind]?.[value]) || 'neutral';
}
