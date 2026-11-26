import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageFallback } from '@/shared/ui/page-fallback';
import { MasterDetailPage } from '@/views/masters';

export const metadata: Metadata = { title: 'Master' };

export default function Page() {
	return (
		<Suspense fallback={<PageFallback />}>
			<MasterDetailPage />
		</Suspense>
	);
}
