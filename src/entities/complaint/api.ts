'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { cleanParams, http } from '@/shared/api/client';
import type {
	AdminComplaint,
	CloseComplaintRequest,
	Complaint,
	ComplaintStatus,
	Page,
} from '@/shared/api/types';

export interface ComplaintsParams {
	status?: ComplaintStatus;
	orderId?: string;
	againstUserId?: string;
	authorId?: string;
	page?: number;
	size?: number;
	sort?: string;
}

export const complaintKeys = {
	list: (p: ComplaintsParams) => ['admin', 'complaints', p] as const,
	detail: (id: string) => ['admin', 'complaint', id] as const,
};

export function useAdminComplaints(p: ComplaintsParams, enabled = true) {
	return useQuery({
		queryKey: complaintKeys.list(p),
		queryFn: () => http.get<Page<Complaint>>('/admin/complaints', cleanParams(p)),
		placeholderData: keepPreviousData,
		enabled,
	});
}

export function useAdminComplaint(id: string) {
	return useQuery({
		queryKey: complaintKeys.detail(id),
		queryFn: () => http.get<AdminComplaint>(`/admin/complaints/${id}`),
	});
}

export const complaintApi = {
	take: (id: string) => http.post<AdminComplaint>(`/admin/complaints/${id}/take`),
	close: (id: string, body: CloseComplaintRequest) =>
		http.post<AdminComplaint>(`/admin/complaints/${id}/close`, body),
};
