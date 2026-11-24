'use client';

import { Badge } from '@/shared/ui/kit/badge';
import { useEnumLabel } from '@/shared/i18n/use-enum';
import { statusTone, type EnumName } from '@/shared/lib/status';
import { cn } from '@/shared/lib/utils';

export function StatusBadge({
	kind,
	value,
	className,
}: {
	kind: EnumName;
	value: string | null | undefined;
	className?: string;
}) {
	const label = useEnumLabel();
	if (!value) return <span className='text-subtle-foreground'>—</span>;
	const tone = statusTone(kind, value);
	return (
		<Badge tone={tone} className={cn(className)}>
			{tone !== 'neutral' && tone !== 'outline' && (
				<span className='size-1.5 rounded-full bg-current' aria-hidden />
			)}
			{label(kind, value)}
		</Badge>
	);
}
