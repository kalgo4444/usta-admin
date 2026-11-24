'use client';

import { useTranslations } from 'next-intl';
import { Label } from '@/shared/ui/kit/label';
import { cn } from '@/shared/lib/utils';

export function CharCounter({ value, max }: { value: string | undefined; max: number }) {
	const t = useTranslations('common');
	const n = value?.length ?? 0;
	return (
		<span className={cn('num text-xs', n > max ? 'text-destructive' : 'text-subtle-foreground')}>
			{t('chars', { count: n, max })}
		</span>
	);
}

/** Label + control + error/hint, used by every form. */
export function Field({
	label,
	htmlFor,
	error,
	hint,
	counter,
	required,
	className,
	children,
}: {
	label: React.ReactNode;
	htmlFor?: string;
	error?: string;
	hint?: React.ReactNode;
	counter?: { value: string | undefined; max: number };
	required?: boolean;
	className?: string;
	children: React.ReactNode;
}) {
	return (
		<div className={cn('space-y-2', className)}>
			<div className='flex items-baseline justify-between gap-2'>
				<Label htmlFor={htmlFor}>
					{label}
					{required && <span className='text-destructive'> *</span>}
				</Label>
				{counter && <CharCounter {...counter} />}
			</div>
			{children}
			{error ? (
				<p className='text-xs text-destructive'>{error}</p>
			) : hint ? (
				<p className='text-xs text-subtle-foreground'>{hint}</p>
			) : null}
		</div>
	);
}
