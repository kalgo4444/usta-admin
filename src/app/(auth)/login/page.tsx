import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ScreenFallback } from '@/shared/ui/page-fallback';
import { LoginPage } from '@/views/login/login-page';

export const metadata: Metadata = { title: 'Login' };

export default function Page() {
	return (
		<Suspense fallback={<ScreenFallback />}>
			<LoginPage />
		</Suspense>
	);
}
