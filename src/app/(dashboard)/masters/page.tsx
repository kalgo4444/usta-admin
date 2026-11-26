import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageFallback } from '@/shared/ui/page-fallback';
import { MastersPage } from '@/views/masters';

export const metadata: Metadata = { title: 'Masters' };

export default function Page() {
	return (
		<Suspense fallback={<PageFallback />}>
			<MastersPage />
		</Suspense>
	);
}
