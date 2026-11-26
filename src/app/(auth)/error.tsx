'use client';

import { ErrorState } from '@/shared/ui/error-state';

/** Inside the root Providers, so unlike global-error this one is localised. */
export default function AuthError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<div className='flex min-h-screen items-center justify-center'>
			<ErrorState error={error} onRetry={reset} />
		</div>
	);
}
