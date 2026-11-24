import * as React from 'react';
import { cn } from '@/shared/lib/utils';

export const fieldBase =
	'w-full min-w-0 rounded-md border border-input bg-background px-4 text-base text-foreground placeholder:text-subtle-foreground outline-none transition-[border-color,box-shadow] focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/30';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
	return (
		<input type={type} data-slot='input' className={cn(fieldBase, 'h-12', className)} {...props} />
	);
}

export { Input };
