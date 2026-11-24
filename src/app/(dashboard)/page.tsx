import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageFallback } from '@/shared/ui/page-fallback';
import { OverviewPage } from '@/views/overview/overview-page';

export const metadata: Metadata = { title: 'Overview' };

export default function Page() {
	return (
		<Suspense fallback={<PageFallback />}>
			<OverviewPage />
		</Suspense>
	);
}
