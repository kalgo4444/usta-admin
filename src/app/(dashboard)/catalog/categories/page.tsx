import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageFallback } from '@/shared/ui/page-fallback';
import { CategoriesPage } from '@/views/catalog';

export const metadata: Metadata = { title: 'Categories' };

export default function Page() {
	return (
		<Suspense fallback={<PageFallback />}>
			<CategoriesPage />
		</Suspense>
	);
}
