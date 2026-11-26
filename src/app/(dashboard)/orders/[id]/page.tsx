import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageFallback } from '@/shared/ui/page-fallback';
import { OrderDetailPage } from '@/views/orders';

export const metadata: Metadata = { title: 'Order' };

export default function Page() {
	return (
		<Suspense fallback={<PageFallback />}>
			<OrderDetailPage />
		</Suspense>
	);
}
