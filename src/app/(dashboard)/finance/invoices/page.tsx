import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageFallback } from '@/shared/ui/page-fallback';
import { InvoicesPage } from '@/views/finance';

export const metadata: Metadata = { title: 'Invoices' };

export default function Page() {
	return (
		<Suspense fallback={<PageFallback />}>
			<InvoicesPage />
		</Suspense>
	);
}
