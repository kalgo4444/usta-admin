import type { components } from './schema';

type S = components['schemas'];

export type UserResponse = S['UserResponse'];
export type TokenResponse = S['TokenResponse'];
export type OtpChallengeResponse = S['OtpChallengeResponse'];
export type MetaResponse = S['MetaResponse'];

export type AdminUser = S['AdminUserResponse'];
export type AdminMaster = S['AdminMasterResponse'];
export type AdminMasterDetail = S['AdminMasterDetailResponse'];
export type MasterProfile = S['MasterProfileResponse'];
export type MasterDocument = S['DocumentResponse'];
export type PublicMasterService = S['PublicMasterServiceResponse'];
export type PortfolioItem = S['PortfolioItemResponse'];
export type PublicReview = S['PublicReviewResponse'];

export type OrderSummary = S['OrderSummary'];
export type AdminOrder = S['AdminOrderResponse'];
export type Order = S['OrderResponse'];
export type OrderHistory = S['HistoryResponse'];
export type Offer = S['OfferResponse'];
export type Attachment = S['AttachmentResponse'];
export type ChatMessage = S['MessageView'];

export type Complaint = S['ComplaintResponse'];
export type AdminComplaint = S['AdminComplaintResponse'];

export type Category = S['CategoryAdminResponse'];
export type CategoryRequest = S['CategoryRequest'];
export type CatalogService = S['ServiceAdminResponse'];
export type ServiceRequest = S['ServiceRequest'];

export type Invoice = S['Invoice'];
export type Commission = S['CommissionResponse'];
export type Transaction = S['TransactionResponse'];
export type ReconciliationReport = S['Report'];
export type Mismatch = S['Mismatch'];
export type SettleRequest = S['SettleRequest'];
export type SettlementResponse = S['SettlementResponse'];

export type ResolveDisputeRequest = S['ResolveDisputeRequest'];
export type CloseComplaintRequest = S['CloseRequest'];

export type UserRole = NonNullable<UserResponse['roles']>[number];
export type UserStatus = NonNullable<UserResponse['status']>;
export type VerificationStatus = NonNullable<MasterProfile['verificationStatus']>;
export type DocumentType = NonNullable<MasterDocument['type']>;
export type OrderStatus = NonNullable<OrderSummary['status']>;
export type OfferStatus = NonNullable<Offer['status']>;
export type ComplaintReason = NonNullable<Complaint['reason']>;
export type ComplaintStatus = NonNullable<Complaint['status']>;
export type CatalogStatus = NonNullable<Category['status']>;
export type TransactionType = NonNullable<Transaction['type']>;
export type CommissionStatus = NonNullable<Commission['status']>;

/** Spring page envelope used by every paginated admin endpoint. */
export interface Page<T> {
	items?: T[];
	page?: number;
	size?: number;
	totalElements?: number;
	totalPages?: number;
}

export const ENUMS = {
	userRole: ['CUSTOMER', 'MASTER', 'ADMIN'],
	userStatus: ['ACTIVE', 'BLOCKED'],
	verificationStatus: ['NOT_SUBMITTED', 'PENDING', 'APPROVED', 'REJECTED'],
	documentType: ['PASSPORT', 'SELFIE', 'CERTIFICATE', 'OTHER'],
	orderStatus: [
		'CREATED',
		'SEARCHING',
		'ACCEPTED',
		'IN_PROGRESS',
		'COMPLETED',
		'COMMISSION',
		'REVIEWED',
		'CANCELLED',
		'EXPIRED',
		'DISPUTED',
	],
	offerStatus: ['PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED'],
	complaintReason: ['QUALITY', 'NO_SHOW', 'PRICE', 'BEHAVIOR', 'FRAUD', 'OTHER'],
	complaintStatus: ['OPEN', 'IN_REVIEW', 'RESOLVED', 'REJECTED'],
	catalogStatus: ['ACTIVE', 'INACTIVE'],
	transactionType: ['COMMISSION_CHARGE', 'COMMISSION_REVERSAL', 'COMMISSION_PAYMENT', 'ADJUSTMENT'],
	commissionStatus: ['ACCRUED', 'INVOICED', 'PAID', 'CANCELLED'],
} as const satisfies {
	userRole: readonly UserRole[];
	userStatus: readonly UserStatus[];
	verificationStatus: readonly VerificationStatus[];
	documentType: readonly DocumentType[];
	orderStatus: readonly OrderStatus[];
	offerStatus: readonly OfferStatus[];
	complaintReason: readonly ComplaintReason[];
	complaintStatus: readonly ComplaintStatus[];
	catalogStatus: readonly CatalogStatus[];
	transactionType: readonly TransactionType[];
	commissionStatus: readonly CommissionStatus[];
};
