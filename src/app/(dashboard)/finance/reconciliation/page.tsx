import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageFallback } from '@/shared/ui/page-fallback';
import { ReconciliationPage } from '@/views/finance';

export const metadata: Metadata = { title: 'Reconciliation' };

export default function Page() {
	return (
		<Suspense fallback={<PageFallback />}>
			<ReconciliationPage />
		</Suspense>
	);
}
