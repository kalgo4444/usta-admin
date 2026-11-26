'use client';

import { useMemo, useState } from 'react';
import { CheckIcon, ChevronDownIcon, SearchIcon, ShapesIcon, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { fieldBase } from '@/shared/ui/kit/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/kit/popover';
import { Skeleton } from '@/shared/ui/kit/skeleton';
import { useCatalogIcons } from './api';

/**
 * `iconUrl` is either a relative path to a one-colour set SVG (served through our
 * /api/v1 proxy; painted with `currentColor` via a CSS mask) or a full presigned URL of
 * an uploaded PNG/WEBP. `null` → fallback icon.
 */
export function CatalogIcon({
	url,
	fallback: Fallback = ShapesIcon,
	className,
}: {
	url: string | null | undefined;
	fallback?: LucideIcon;
	className?: string;
}) {
	const size = cn('size-4 shrink-0', className);
	if (!url) return <Fallback className={cn(size, 'text-muted-foreground')} aria-hidden />;
	if (url.startsWith('/')) {
		const mask = `url("${url}") center / contain no-repeat`;
		return (
			<span
				aria-hidden
				className={cn(size, 'inline-block bg-current')}
				style={{ mask, WebkitMask: mask }}
			/>
		);
	}
	// eslint-disable-next-line @next/next/no-img-element -- presigned URL
	return <img src={url} alt='' className={cn(size, 'rounded-xs object-contain')} />;
}

/** Searchable grid over `/public/catalog/icons`. Value is the icon `key` ('' = none). */
export function IconPicker({
	value,
	onChange,
	invalid,
}: {
	value: string;
	onChange: (key: string) => void;
	invalid?: boolean;
}) {
	const t = useTranslations('catalog');
	const q = useCatalogIcons();
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState('');

	const icons = useMemo(() => q.data ?? [], [q.data]);
	const filtered = useMemo(() => {
		const s = search.trim().toLowerCase();
		return icons.filter(
			i => !s || i.key?.toLowerCase().includes(s) || i.name?.toLowerCase().includes(s),
		);
	}, [icons, search]);
	const selected = icons.find(i => i.key === value);

	const pick = (key: string) => {
		onChange(key);
		setOpen(false);
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<button
					type='button'
					data-invalid={invalid || undefined}
					className={cn(
						fieldBase,
						'flex h-12 items-center gap-2 text-left data-invalid:border-destructive',
					)}
				>
					<CatalogIcon url={selected?.url} className='size-5' />
					<span className={cn('flex-1 truncate', !value && 'text-subtle-foreground')}>
						{selected?.name ?? (value || t('iconNone'))}
					</span>
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
						placeholder={t('iconSearch')}
						className='h-11 flex-1 bg-transparent text-sm outline-none'
					/>
				</label>
				<div className='max-h-72 overflow-y-auto p-2'>
					<button
						type='button'
						onClick={() => pick('')}
						className='mb-2 flex w-full items-center justify-between rounded-sm px-3 py-2 text-left text-sm hover:bg-secondary'
					>
						{t('iconNone')}
						{!value && <CheckIcon className='size-4' />}
					</button>
					{q.isLoading && <Skeleton className='h-24' />}
					<div className='grid grid-cols-5 gap-1'>
						{filtered.map(i => (
							<button
								key={i.key}
								type='button'
								title={i.name}
								aria-label={i.name}
								aria-pressed={i.key === value}
								onClick={() => pick(i.key ?? '')}
								className={cn(
									'flex aspect-square items-center justify-center rounded-md hover:bg-secondary',
									i.key === value && 'bg-primary/10 text-primary',
								)}
							>
								<CatalogIcon url={i.url} className='size-6' />
							</button>
						))}
					</div>
					{!q.isLoading && filtered.length === 0 && (
						<p className='px-3 py-6 text-center text-sm text-muted-foreground'>{t('noIcons')}</p>
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
}
