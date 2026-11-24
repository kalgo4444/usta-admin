import { Skeleton } from '@/shared/ui/kit/skeleton';

/** Static shell shown while client hooks (search params, route params) resolve. */
export function PageFallback() {
	return (
		<div className='space-y-6'>
			<Skeleton className='h-10 w-64' />
			<Skeleton className='h-10 w-96 rounded-pill' />
			<Skeleton className='h-96 rounded-xl' />
		</div>
	);
}

export function ScreenFallback() {
	return (
		<div className='flex min-h-screen items-center justify-center'>
			<span className='size-6 animate-spin rounded-full border-2 border-border border-t-primary' />
		</div>
	);
}
