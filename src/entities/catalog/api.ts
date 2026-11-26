'use client';

import { useQuery } from '@tanstack/react-query';
import { cleanParams, http } from '@/shared/api/client';
import type {
	CatalogIconItem,
	CatalogService,
	Category,
	CategoryRequest,
	ServiceRequest,
} from '@/shared/api/types';

export const catalogKeys = {
	categories: ['admin', 'categories'] as const,
	services: (p: { categoryId?: string }) => ['admin', 'services', p] as const,
	icons: ['public', 'icons'] as const,
};

export type CatalogKind = 'categories' | 'services';
type MediaSlot = 'image' | 'icon';

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

/** Ready-made icon set (`key` goes into the `icon` field). Static, so cached forever. */
export function useCatalogIcons() {
	return useQuery({
		queryKey: catalogKeys.icons,
		queryFn: () =>
			http.get<CatalogIconItem[]>('/public/catalog/icons', undefined, { skipAuth: true }),
		staleTime: Infinity,
	});
}

export const catalogApi = {
	createCategory: (b: CategoryRequest) => http.post<Category>('/admin/catalog/categories', b),
	updateCategory: (id: string, b: CategoryRequest) =>
		http.put<Category>(`/admin/catalog/categories/${id}`, b),
	createService: (b: ServiceRequest) => http.post<CatalogService>('/admin/catalog/services', b),
	updateService: (id: string, b: ServiceRequest) =>
		http.put<CatalogService>(`/admin/catalog/services/${id}`, b),
	/** Archive. A non-empty category is refused with 409 CATEGORY_NOT_EMPTY unless `cascade`. */
	deleteCategory: (id: string, cascade = false) =>
		http.delete(`/admin/catalog/categories/${id}`, cascade ? { cascade: true } : undefined),
	/** Also removes masters' prices for the service; old orders keep its name. */
	deleteService: (id: string) => http.delete(`/admin/catalog/services/${id}`),
	uploadMedia: (kind: CatalogKind, id: string, slot: MediaSlot, file: File) => {
		const fd = new FormData();
		fd.append('file', file);
		return http.put<Category | CatalogService>(`/admin/catalog/${kind}/${id}/${slot}`, fd);
	},
	removeMedia: (kind: CatalogKind, id: string, slot: MediaSlot) =>
		http.delete<Category | CatalogService>(`/admin/catalog/${kind}/${id}/${slot}`),
};
