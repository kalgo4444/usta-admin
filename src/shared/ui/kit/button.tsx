import * as React from 'react';
import { Slot } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib/utils';

const buttonVariants = cva(
	"inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-pill font-semibold transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
	{
		variants: {
			variant: {
				default:
					'bg-primary text-primary-foreground hover:bg-primary-active active:bg-primary-active disabled:bg-primary-disabled',
				secondary: 'bg-secondary text-secondary-foreground hover:bg-border/70 disabled:opacity-50',
				outline: 'border border-border bg-transparent hover:bg-secondary disabled:opacity-50',
				ghost: 'hover:bg-secondary disabled:opacity-50',
				destructive: 'bg-destructive text-white hover:bg-destructive/90 disabled:opacity-50',
				link: 'h-auto rounded-none px-0 text-primary underline-offset-4 hover:underline',
			},
			size: {
				default: 'h-11 px-5 text-base',
				sm: 'h-9 px-4 text-sm',
				xs: 'h-7 px-3 text-xs',
				icon: 'size-10',
				'icon-sm': 'size-8',
			},
		},
		defaultVariants: { variant: 'default', size: 'default' },
	},
);

function Button({
	className,
	variant,
	size,
	asChild = false,
	...props
}: React.ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
	const Comp = asChild ? Slot.Root : 'button';
	return (
		<Comp
			data-slot='button'
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		/>
	);
}

export { Button, buttonVariants };
