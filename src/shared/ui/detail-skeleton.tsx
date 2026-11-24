import { Skeleton } from '@/shared/ui/kit/skeleton';

export function DetailSkeleton() {
	return (
		<div className='space-y-6'>
			<Skeleton className='h-5 w-24' />
			<Skeleton className='h-10 w-72' />
			<div className='grid gap-4 lg:grid-cols-3'>
				<Skeleton className='h-72 rounded-xl lg:col-span-2' />
				<Skeleton className='h-72 rounded-xl' />
			</div>
		</div>
	);
}
