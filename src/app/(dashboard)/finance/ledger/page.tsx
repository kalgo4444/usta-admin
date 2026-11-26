import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageFallback } from '@/shared/ui/page-fallback';
import { LedgerPage } from '@/views/finance';

export const metadata: Metadata = { title: 'Ledger' };

export default function Page() {
	return (
		<Suspense fallback={<PageFallback />}>
			<LedgerPage />
		</Suspense>
	);
}
