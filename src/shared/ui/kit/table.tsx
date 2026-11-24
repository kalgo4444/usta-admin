import * as React from 'react';
import { cn } from '@/shared/lib/utils';

function Table({ className, ...props }: React.ComponentProps<'table'>) {
	return (
		<div className='relative w-full overflow-x-auto'>
			<table className={cn('w-full caption-bottom text-sm', className)} {...props} />
		</div>
	);
}
function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
	return <thead className={cn('[&_tr]:border-b', className)} {...props} />;
}
function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
	return <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />;
}
function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
	return (
		<tr
			className={cn(
				'border-b border-border-soft transition-colors data-[clickable=true]:cursor-pointer data-[clickable=true]:hover:bg-muted',
				className,
			)}
			{...props}
		/>
	);
}
function TableHead({ className, ...props }: React.ComponentProps<'th'>) {
	return (
		<th
			className={cn(
				'h-11 px-3 text-left align-middle text-xs font-semibold whitespace-nowrap text-muted-foreground first:pl-6 last:pr-6',
				className,
			)}
			{...props}
		/>
	);
}
function TableCell({ className, ...props }: React.ComponentProps<'td'>) {
	return (
		<td className={cn('px-3 py-3.5 align-middle first:pl-6 last:pr-6', className)} {...props} />
	);
}

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
