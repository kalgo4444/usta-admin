import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageFallback } from '@/shared/ui/page-fallback';
import { AdminsPage } from '@/views/admins/admins-page';

export const metadata: Metadata = { title: 'Admins' };

export default function Page() {
	return (
		<Suspense fallback={<PageFallback />}>
			<AdminsPage />
		</Suspense>
	);
}
