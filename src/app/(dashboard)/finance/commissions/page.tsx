import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageFallback } from '@/shared/ui/page-fallback';
import { CommissionsPage } from '@/views/finance';

export const metadata: Metadata = { title: 'Commissions' };

export default function Page() {
	return (
		<Suspense fallback={<PageFallback />}>
			<CommissionsPage />
		</Suspense>
	);
}
