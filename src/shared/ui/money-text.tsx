import { formatMoney } from '@/shared/lib/format';
import { cn } from '@/shared/lib/utils';

export function MoneyText({
	value,
	signed = false,
	className,
}: {
	value: number | null | undefined;
	/** Colour by sign: positive green, negative red (semantic text colour only). */
	signed?: boolean;
	className?: string;
}) {
	const tone =
		signed && value
			? value > 0
				? 'text-success'
				: value < 0
					? 'text-destructive'
					: undefined
			: undefined;
	return (
		<span className={cn('num whitespace-nowrap', tone, className)}>
			{signed && value && value > 0 ? '+' : ''}
			{formatMoney(value)}
		</span>
	);
}
