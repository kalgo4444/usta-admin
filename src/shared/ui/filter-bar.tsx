'use client';

import { useEffect, useState } from 'react';
import { SearchIcon, XIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useDebouncedValue } from '@/shared/lib/use-debounce';
import { ALL } from '@/shared/lib/use-table-params';
import { cn } from '@/shared/lib/utils';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/shared/ui/kit/select';
import { Badge } from '@/shared/ui/kit/badge';

export function FilterBar({
	className,
	children,
}: {
	className?: string;
	children: React.ReactNode;
}) {
	return <div className={cn('flex flex-wrap items-center gap-2', className)}>{children}</div>;
}

/** Pill search input that commits after a debounce (plan: 400 ms). */
export function SearchInput({
	value,
	onCommit,
	placeholder,
	className,
}: {
	value: string | undefined;
	onCommit: (v: string | undefined) => void;
	placeholder?: string;
	className?: string;
}) {
	const [text, setText] = useState(value ?? '');
	const debounced = useDebouncedValue(text, 400);

	useEffect(() => {
		if ((debounced || undefined) !== (value || undefined)) onCommit(debounced || undefined);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [debounced]);

	return (
		<label
			className={cn(
				'flex h-10 w-full max-w-xs items-center gap-2 rounded-pill bg-secondary px-4 text-sm focus-within:ring-1 focus-within:ring-primary',
				className,
			)}
		>
			<SearchIcon className='size-4 text-muted-foreground' />
			<input
				value={text}
				onChange={e => setText(e.target.value)}
				placeholder={placeholder}
				className='min-w-0 flex-1 bg-transparent outline-none placeholder:text-subtle-foreground'
			/>
			{text && (
				<button
					type='button'
					onClick={() => setText('')}
					className='text-muted-foreground hover:text-foreground'
				>
					<XIcon className='size-4' />
				</button>
			)}
		</label>
	);
}

/** Pill select with an "All" option mapped to `undefined`. */
export function FilterSelect({
	value,
	onChange,
	options,
	allLabel,
	className,
}: {
	value: string | undefined;
	onChange: (v: string | undefined) => void;
	options: { value: string; label: string }[];
	allLabel: string;
	className?: string;
}) {
	return (
		<Select value={value ?? ALL} onValueChange={v => onChange(v === ALL ? undefined : v)}>
			<SelectTrigger size='sm' className={cn('w-auto min-w-40', className)}>
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value={ALL}>{allLabel}</SelectItem>
				{options.map(o => (
					<SelectItem key={o.value} value={o.value}>
						{o.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

/** Removable chip for an id filter coming from the URL (e.g. ?masterId=…). */
export function FilterChip({ label, onClear }: { label: React.ReactNode; onClear: () => void }) {
	const t = useTranslations('common');
	return (
		<Badge tone='blue' className='h-8 gap-2 px-3 text-sm'>
			{label}
			<button type='button' aria-label={t('removeFilter')} onClick={onClear}>
				<XIcon className='size-3.5' />
			</button>
		</Badge>
	);
}
