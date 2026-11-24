import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib/utils';

const badgeVariants = cva(
	'inline-flex w-fit shrink-0 items-center gap-1 rounded-pill px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap [&_svg]:size-3',
	{
		variants: {
			tone: {
				neutral: 'bg-secondary text-foreground',
				blue: 'bg-primary/10 text-primary',
				amber: 'bg-warning/12 text-warning',
				green: 'bg-success/12 text-success',
				red: 'bg-destructive/10 text-destructive',
				gray: 'bg-secondary text-muted-foreground',
				outline: 'border border-border text-muted-foreground',
			},
		},
		defaultVariants: { tone: 'neutral' },
	},
);

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>['tone']>;

function Badge({
	className,
	tone,
	...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
	return <span data-slot='badge' className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export { Badge, badgeVariants };
