'use client';

import { useMemo, useState } from 'react';
import { CheckIcon, ChevronDownIcon, SearchIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { masterName, useMasterDirectory } from '@/entities/master/api';
import { formatPhone } from '@/shared/lib/format';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/kit/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/kit/popover';
import { Skeleton } from '@/shared/ui/kit/skeleton';

/** id → display name, built from the client-side master directory. */
export function useMasterNames() {
	const q = useMasterDirectory();
	return useMemo(() => {
		const m = new Map<string, string>();
		for (const p of q.data?.pages ?? [])
			for (const it of p.items ?? [])
				if (it.profile?.userId)
					m.set(it.profile.userId, masterName(it.profile, formatPhone(it.phone)));
		return m;
	}, [q.data]);
}

/** Searchable master select (name or phone). `/admin/masters` has no text filter, so search is client-side. */
export function MasterPicker({
	value,
	onChange,
	placeholder,
	allowClear,
	allLabel,
	className,
}: {
	value: string | undefined;
	onChange: (id: string | undefined) => void;
	placeholder?: string;
	allowClear?: boolean;
	allLabel?: string;
	className?: string;
}) {
	const t = useTranslations('finance');
	const tc = useTranslations('common');
	const q = useMasterDirectory();
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState('');

	const all = useMemo(() => (q.data?.pages ?? []).flatMap(p => p.items ?? []), [q.data]);
	const filtered = useMemo(() => {
		const s = search.trim().toLowerCase();
		const digits = s.replace(/\D/g, '');
		return all.filter(
			m =>
				!s ||
				m.profile?.fullName?.toLowerCase().includes(s) ||
				(digits.length >= 3 && m.phone?.replace(/\D/g, '').includes(digits)),
		);
	}, [all, search]);

	const selected = all.find(m => m.profile?.userId === value);
	const label = selected
		? masterName(selected.profile, formatPhone(selected.phone))
		: value
			? value.slice(0, 8)
			: undefined;

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<button
					type='button'
					className={cn(
						'flex h-10 min-w-56 items-center justify-between gap-2 rounded-pill bg-secondary px-4 text-sm',
						!label && 'text-subtle-foreground',
						className,
					)}
				>
					<span className='truncate'>{label ?? placeholder ?? t('selectMaster')}</span>
					<ChevronDownIcon className='size-4 opacity-60' />
				</button>
			</PopoverTrigger>
			<PopoverContent className='w-80 p-0'>
				<label className='flex items-center gap-2 border-b border-border px-3'>
					<SearchIcon className='size-4 text-muted-foreground' />
					<input
						autoFocus
						value={search}
						onChange={e => setSearch(e.target.value)}
						placeholder={t('searchMaster')}
						className='h-11 flex-1 bg-transparent text-sm outline-none'
					/>
				</label>
				<div className='max-h-72 overflow-y-auto p-1'>
					{allowClear && (
						<button
							type='button'
							onClick={() => {
								onChange(undefined);
								setOpen(false);
							}}
							className='flex w-full items-center justify-between rounded-sm px-3 py-2 text-left text-sm hover:bg-secondary'
						>
							{allLabel ?? tc('all')}
							{!value && <CheckIcon className='size-4' />}
						</button>
					)}
					{q.isLoading && <Skeleton className='m-2 h-8' />}
					{filtered.map(m => (
						<button
							key={m.profile?.userId}
							type='button'
							onClick={() => {
								onChange(m.profile?.userId);
								setOpen(false);
							}}
							className='flex w-full items-center justify-between gap-2 rounded-sm px-3 py-2 text-left text-sm hover:bg-secondary'
						>
							<span className='min-w-0'>
								<span className='block truncate'>{masterName(m.profile, '—')}</span>
								<span className='block num text-xs text-muted-foreground'>
									{formatPhone(m.phone)}
								</span>
							</span>
							{m.profile?.userId === value && <CheckIcon className='size-4 shrink-0' />}
						</button>
					))}
					{!q.isLoading && filtered.length === 0 && (
						<p className='px-3 py-6 text-center text-sm text-muted-foreground'>{tc('noData')}</p>
					)}
					{q.hasNextPage && (
						<Button
							variant='ghost'
							size='sm'
							className='w-full'
							disabled={q.isFetchingNextPage}
							onClick={() => q.fetchNextPage()}
						>
							{q.isFetchingNextPage ? tc('loading') : tc('next')}
						</Button>
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
}
