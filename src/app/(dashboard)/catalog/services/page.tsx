import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageFallback } from '@/shared/ui/page-fallback';
import { ServicesPage } from '@/views/catalog/services-page';

export const metadata: Metadata = { title: 'Services' };

export default function Page() {
	return (
		<Suspense fallback={<PageFallback />}>
			<ServicesPage />
		</Suspense>
	);
}
