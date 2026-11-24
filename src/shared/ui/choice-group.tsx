'use client';

import { cn } from '@/shared/lib/utils';

/** Segmented radio group (pill geometry). */
export function ChoiceGroup<V extends string>({
	value,
	onChange,
	options,
	className,
	name,
}: {
	value: V | undefined;
	onChange: (v: V) => void;
	options: { value: V; label: React.ReactNode; tone?: 'default' | 'danger' }[];
	className?: string;
	name: string;
}) {
	return (
		<div role='radiogroup' className={cn('grid gap-2 sm:auto-cols-fr sm:grid-flow-col', className)}>
			{options.map(o => {
				const active = o.value === value;
				return (
					<label
						key={o.value}
						className={cn(
							'flex cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-3 text-sm font-medium transition-colors',
							active
								? o.tone === 'danger'
									? 'border-destructive bg-destructive/5 text-destructive'
									: 'border-primary bg-primary/5 text-primary'
								: 'border-border hover:bg-secondary',
						)}
					>
						<input
							type='radio'
							className='sr-only'
							name={name}
							value={o.value}
							checked={active}
							onChange={() => onChange(o.value)}
						/>
						{o.label}
					</label>
				);
			})}
		</div>
	);
}
