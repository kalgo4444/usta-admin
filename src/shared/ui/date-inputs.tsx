'use client';

import dayjs from 'dayjs';
import { XIcon } from 'lucide-react';
import { weekStart } from '@/shared/lib/format';
import { cn } from '@/shared/lib/utils';

const pill =
	'num h-10 rounded-pill bg-secondary px-4 text-sm outline-none focus-visible:ring-1 focus-visible:ring-primary [color-scheme:light] dark:[color-scheme:dark]';

/** Week (Monday) picker: any picked day snaps to that week's Monday. */
export function WeekPicker({
	value,
	onChange,
	label,
	className,
}: {
	value: string | undefined;
	onChange: (monday: string | undefined) => void;
	label: string;
	className?: string;
}) {
	return (
		<label className={cn('flex items-center gap-2 text-sm', className)}>
			<span className='text-muted-foreground'>{label}</span>
			<input
				type='date'
				className={pill}
				value={value ?? ''}
				onChange={e => onChange(e.target.value ? weekStart(e.target.value) : undefined)}
			/>
			{value && (
				<span className='num text-xs text-muted-foreground'>
					{dayjs(value).format('DD.MM')}–{dayjs(value).add(6, 'day').format('DD.MM')}
				</span>
			)}
			{value && (
				<button
					type='button'
					onClick={() => onChange(undefined)}
					className='text-muted-foreground hover:text-foreground'
				>
					<XIcon className='size-4' />
				</button>
			)}
		</label>
	);
}

export function DateInput({
	value,
	onChange,
	label,
}: {
	value: string | undefined;
	onChange: (v: string | undefined) => void;
	label: string;
}) {
	return (
		<label className='flex items-center gap-2 text-sm'>
			<span className='text-muted-foreground'>{label}</span>
			<input
				type='date'
				className={pill}
				value={value ?? ''}
				onChange={e => onChange(e.target.value || undefined)}
			/>
		</label>
	);
}
