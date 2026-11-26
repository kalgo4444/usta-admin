import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageFallback } from '@/shared/ui/page-fallback';
import { ComplaintsPage } from '@/views/complaints';

export const metadata: Metadata = { title: 'Complaints' };

export default function Page() {
	return (
		<Suspense fallback={<PageFallback />}>
			<ComplaintsPage />
		</Suspense>
	);
}
