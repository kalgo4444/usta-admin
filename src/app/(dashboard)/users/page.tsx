import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageFallback } from '@/shared/ui/page-fallback';
import { UsersPage } from '@/views/users';

export const metadata: Metadata = { title: 'Users' };

export default function Page() {
	return (
		<Suspense fallback={<PageFallback />}>
			<UsersPage />
		</Suspense>
	);
}
