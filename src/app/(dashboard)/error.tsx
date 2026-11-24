'use client';

import { ErrorState } from '@/shared/ui/error-state';

export default function DashboardError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return <ErrorState error={error} onRetry={reset} />;
}
