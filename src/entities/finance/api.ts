'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { cleanParams, http } from '@/shared/api/client';
import type {
	Commission,
	CommissionStatus,
	Invoice,
	Page,
	ReconciliationReport,
	SettleRequest,
	SettlementResponse,
	Transaction,
} from '@/shared/api/types';

export interface InvoicesParams {
	period?: string;
	masterId?: string;
}
export interface CommissionsParams {
	masterId?: string;
	period?: string;
	status?: CommissionStatus;
	page?: number;
	size?: number;
	sort?: string;
}
export interface TransactionsParams {
	masterId: string;
	page?: number;
	size?: number;
	sort?: string;
}

export const financeKeys = {
	invoices: (p: InvoicesParams) => ['admin', 'finance', 'invoices', p] as const,
	commissions: (p: CommissionsParams) => ['admin', 'finance', 'commissions', p] as const,
	transactions: (p: TransactionsParams) => ['admin', 'finance', 'transactions', p] as const,
	reconciliation: (p: { from?: string; to?: string }) =>
		['admin', 'finance', 'reconciliation', p] as const,
};

export function useInvoices(p: InvoicesParams) {
	return useQuery({
		queryKey: financeKeys.invoices(p),
		queryFn: () => http.get<Invoice[]>('/admin/finance/invoices', cleanParams(p)),
		placeholderData: keepPreviousData,
	});
}

export function useCommissions(p: CommissionsParams) {
	return useQuery({
		queryKey: financeKeys.commissions(p),
		queryFn: () => http.get<Page<Commission>>('/admin/finance/commissions', cleanParams(p)),
		placeholderData: keepPreviousData,
	});
}

export function useTransactions(p: TransactionsParams) {
	return useQuery({
		queryKey: financeKeys.transactions(p),
		queryFn: () => http.get<Page<Transaction>>('/admin/finance/transactions', cleanParams(p)),
		placeholderData: keepPreviousData,
		enabled: Boolean(p.masterId),
	});
}

export function useReconciliation(p: { from?: string; to?: string }) {
	return useQuery({
		queryKey: financeKeys.reconciliation(p),
		queryFn: () => http.get<ReconciliationReport>('/admin/finance/reconciliation', cleanParams(p)),
	});
}

export const financeApi = {
	settle: (b: SettleRequest) => http.post<SettlementResponse>('/admin/finance/settlements', b),
	closeWeeks: () => http.post<Record<string, number>>('/admin/finance/invoices/close'),
};

/** Unpaid remainder of an invoice. */
export const invoiceDebt = (i: Invoice) => Math.max(0, (i.invoiced ?? 0) - (i.paid ?? 0));
