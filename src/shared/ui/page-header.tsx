import { cn } from '@/shared/lib/utils';

export function PageHeader({
	title,
	description,
	actions,
	className,
}: {
	title: React.ReactNode;
	description?: React.ReactNode;
	actions?: React.ReactNode;
	className?: string;
}) {
	return (
		<div className={cn('flex flex-wrap items-end justify-between gap-4', className)}>
			<div className='min-w-0 space-y-1'>
				<h1 className='text-[32px] leading-[1.13] font-normal tracking-[-0.4px]'>{title}</h1>
				{description && <div className='text-sm text-muted-foreground'>{description}</div>}
			</div>
			{actions && <div className='flex flex-wrap items-center gap-2'>{actions}</div>}
		</div>
	);
}

/** Label/value pair used in detail pages. */
export function InfoRow({
	label,
	children,
}: {
	label: React.ReactNode;
	children: React.ReactNode;
}) {
	return (
		<div className='grid grid-cols-[minmax(110px,40%)_1fr] gap-3 py-2.5 text-sm'>
			<dt className='text-muted-foreground'>{label}</dt>
			<dd className='min-w-0 break-words'>{children ?? '—'}</dd>
		</div>
	);
}
