'use client';

import { useQuery } from '@tanstack/react-query';
import { cleanParams, http } from '@/shared/api/client';
import type { CatalogService, Category, CategoryRequest, ServiceRequest } from '@/shared/api/types';

export const catalogKeys = {
	categories: ['admin', 'categories'] as const,
	services: (p: { categoryId?: string }) => ['admin', 'services', p] as const,
};

export function useCategories() {
	return useQuery({
		queryKey: catalogKeys.categories,
		queryFn: () => http.get<Category[]>('/admin/catalog/categories'),
		staleTime: 5 * 60_000,
	});
}

export function useServices(p: { categoryId?: string } = {}) {
	return useQuery({
		queryKey: catalogKeys.services(p),
		queryFn: () => http.get<CatalogService[]>('/admin/catalog/services', cleanParams(p)),
		staleTime: 5 * 60_000,
	});
}

export const catalogApi = {
	createCategory: (b: CategoryRequest) => http.post<Category>('/admin/catalog/categories', b),
	updateCategory: (id: string, b: CategoryRequest) =>
		http.put<Category>(`/admin/catalog/categories/${id}`, b),
	createService: (b: ServiceRequest) => http.post<CatalogService>('/admin/catalog/services', b),
	updateService: (id: string, b: ServiceRequest) =>
		http.put<CatalogService>(`/admin/catalog/services/${id}`, b),
};
