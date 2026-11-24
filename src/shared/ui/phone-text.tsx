import { formatPhone } from '@/shared/lib/format';
import { cn } from '@/shared/lib/utils';

export function PhoneText({
	phone,
	className,
}: {
	phone: string | null | undefined;
	className?: string;
}) {
	return <span className={cn('num whitespace-nowrap', className)}>{formatPhone(phone)}</span>;
}
