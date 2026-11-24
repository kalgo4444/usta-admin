import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';
import { safeHttpUrl } from '@/shared/lib/url';

/**
 * Opens a backend-supplied URL in a new tab. Unsafe or missing URLs render the same
 * content as a visibly disabled, non-interactive tile instead of a dead link.
 */
export function ExternalLink({
	href,
	className,
	title,
	children,
}: {
	href: string | null | undefined;
	className?: string;
	title?: string;
	children: ReactNode;
}) {
	const safe = safeHttpUrl(href);
	if (!safe) {
		return (
			<div aria-disabled title={title} className={cn(className, 'cursor-not-allowed opacity-60')}>
				{children}
			</div>
		);
	}
	return (
		<a href={safe} target='_blank' rel='noopener noreferrer' title={title} className={className}>
			{children}
		</a>
	);
}
