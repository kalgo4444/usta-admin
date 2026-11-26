import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageFallback } from '@/shared/ui/page-fallback';
import { OrdersPage } from '@/views/orders';

export const metadata: Metadata = { title: 'Orders' };

export default function Page() {
	return (
		<Suspense fallback={<PageFallback />}>
			<OrdersPage />
		</Suspense>
	);
}
