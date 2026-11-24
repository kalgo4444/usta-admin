import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageFallback } from '@/shared/ui/page-fallback';
import { SystemPage } from '@/views/system/system-page';

export const metadata: Metadata = { title: 'System' };

export default function Page() {
	return (
		<Suspense fallback={<PageFallback />}>
			<SystemPage />
		</Suspense>
	);
}
