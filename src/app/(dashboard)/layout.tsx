import { Suspense } from 'react';
import { ScreenFallback } from '@/shared/ui/page-fallback';
import { AdminShell } from '@/widgets/app-shell';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
	return (
		<Suspense fallback={<ScreenFallback />}>
			<AdminShell>{children}</AdminShell>
		</Suspense>
	);
}
