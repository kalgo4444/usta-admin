'use client';

import * as React from 'react';
import { Tooltip as TooltipPrimitive } from 'radix-ui';
import { cn } from '@/shared/lib/utils';

const TooltipProvider = TooltipPrimitive.Provider;

function Tooltip({ content, children }: { content: React.ReactNode; children: React.ReactNode }) {
	return (
		<TooltipPrimitive.Root delayDuration={200}>
			<TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
			<TooltipPrimitive.Portal>
				<TooltipPrimitive.Content
					sideOffset={6}
					className={cn(
						'z-50 max-w-xs rounded-sm bg-foreground px-2.5 py-1.5 text-xs text-background',
					)}
				>
					{content}
				</TooltipPrimitive.Content>
			</TooltipPrimitive.Portal>
		</TooltipPrimitive.Root>
	);
}

export { Tooltip, TooltipProvider };
