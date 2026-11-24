'use client';

import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { cleanParams, http } from '@/shared/api/client';
import type {
	AdminOrder,
	ChatMessage,
	OrderStatus,
	OrderSummary,
	Page,
	ResolveDisputeRequest,
} from '@/shared/api/types';

export interface OrdersParams {
	status?: OrderStatus;
	customerId?: string;
	masterId?: string;
	serviceId?: string;
	page?: number;
	size?: number;
	sort?: string;
}

export const orderKeys = {
	list: (p: OrdersParams) => ['admin', 'orders', p] as const,
	detail: (id: string) => ['admin', 'order', id] as const,
	chat: (id: string) => ['admin', 'order', id, 'chat'] as const,
};

export function useAdminOrders(p: OrdersParams, enabled = true) {
	return useQuery({
		queryKey: orderKeys.list(p),
		queryFn: () => http.get<Page<OrderSummary>>('/admin/orders', cleanParams(p)),
		placeholderData: keepPreviousData,
		enabled,
	});
}

export function useAdminOrder(id: string | undefined) {
	return useQuery({
		queryKey: orderKeys.detail(id ?? ''),
		queryFn: () => http.get<AdminOrder>(`/admin/orders/${id}`),
		enabled: Boolean(id),
		// attachment URLs are presigned
		staleTime: 0,
	});
}

const CHAT_LIMIT = 100;

/** Read-only chat with "load older" paging; cursor = id of the oldest message loaded. */
export function useOrderChat(orderId: string) {
	return useInfiniteQuery({
		queryKey: orderKeys.chat(orderId),
		initialPageParam: undefined as string | undefined,
		queryFn: ({ pageParam }) =>
			http
				.get<ChatMessage[] | { items?: ChatMessage[] }>(
					`/admin/orders/${orderId}/chat/messages`,
					cleanParams({ before: pageParam, limit: CHAT_LIMIT }),
				)
				// tolerate a paged envelope as well as the documented plain array
				.then((r): ChatMessage[] => (Array.isArray(r) ? r : (r?.items ?? []))),
		getNextPageParam: last => {
			if (last.length < CHAT_LIMIT) return undefined;
			const oldest = last.reduce((a, b) => ((b.createdAt ?? '') < (a.createdAt ?? '') ? b : a));
			return oldest.id;
		},
	});
}

export const orderApi = {
	resolve: (id: string, body: ResolveDisputeRequest) =>
		http.post<AdminOrder>(`/admin/orders/${id}/resolve`, body),
};

export const ACTIVE_ORDER_STATUSES: OrderStatus[] = ['SEARCHING', 'ACCEPTED', 'IN_PROGRESS'];
