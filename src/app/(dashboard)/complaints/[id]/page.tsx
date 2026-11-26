import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageFallback } from '@/shared/ui/page-fallback';
import { ComplaintDetailPage } from '@/views/complaints';

export const metadata: Metadata = { title: 'Complaint' };

export default function Page() {
	return (
		<Suspense fallback={<PageFallback />}>
			<ComplaintDetailPage />
		</Suspense>
	);
}
