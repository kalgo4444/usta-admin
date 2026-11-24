'use client';

import * as React from 'react';
import { Select as SelectPrimitive } from 'radix-ui';
import { CheckIcon, ChevronDownIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

const Select = SelectPrimitive.Root;
const SelectValue = SelectPrimitive.Value;

function SelectTrigger({
	className,
	children,
	size = 'default',
	...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & { size?: 'default' | 'sm' }) {
	return (
		<SelectPrimitive.Trigger
			data-size={size}
			className={cn(
				'flex w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-4 text-left text-sm whitespace-nowrap outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary disabled:opacity-50 aria-invalid:border-destructive data-[placeholder]:text-subtle-foreground data-[size=default]:h-12 data-[size=sm]:h-10 data-[size=sm]:rounded-pill data-[size=sm]:border-transparent data-[size=sm]:bg-secondary *:data-[slot=select-value]:line-clamp-1',
				className,
			)}
			{...props}
		>
			{children}
			<SelectPrimitive.Icon asChild>
				<ChevronDownIcon className='size-4 opacity-60' />
			</SelectPrimitive.Icon>
		</SelectPrimitive.Trigger>
	);
}

function SelectContent({
	className,
	children,
	position = 'popper',
	...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
	return (
		<SelectPrimitive.Portal>
			<SelectPrimitive.Content
				position={position}
				className={cn(
					'relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] overflow-x-hidden overflow-y-auto rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-soft data-[state=open]:animate-in data-[state=open]:fade-in-0',
					position === 'popper' &&
						'w-full min-w-(--radix-select-trigger-width) data-[side=bottom]:translate-y-1',
					className,
				)}
				{...props}
			>
				<SelectPrimitive.Viewport>{children}</SelectPrimitive.Viewport>
			</SelectPrimitive.Content>
		</SelectPrimitive.Portal>
	);
}

function SelectItem({
	className,
	children,
	...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
	return (
		<SelectPrimitive.Item
			className={cn(
				'relative flex w-full cursor-default items-center rounded-sm py-2 pr-8 pl-3 text-sm outline-none select-none focus:bg-secondary data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
				className,
			)}
			{...props}
		>
			<span className='absolute right-2 flex size-3.5 items-center justify-center'>
				<SelectPrimitive.ItemIndicator>
					<CheckIcon className='size-4' />
				</SelectPrimitive.ItemIndicator>
			</span>
			<SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
		</SelectPrimitive.Item>
	);
}

export { Select, SelectValue, SelectTrigger, SelectContent, SelectItem };
