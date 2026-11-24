'use client';

import {
	createColumnHelper,
	rowSortingFeature,
	tableFeatures,
	useTable,
	type ColumnDef,
	type RowData,
	type SortingState,
} from '@tanstack/react-table';
import {
	ArrowDownIcon,
	ArrowUpIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	ChevronsUpDownIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/kit/button';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/shared/ui/kit/select';
import { Skeleton } from '@/shared/ui/kit/skeleton';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/shared/ui/kit/table';
import { EmptyState, ErrorState } from './error-state';

export const tableFeatureSet = tableFeatures({ rowSortingFeature });
export type TableFeatureSet = typeof tableFeatureSet;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Columns<T extends RowData> = ColumnDef<TableFeatureSet, T, any>[];

/** Column helper bound to the shared feature set. Mark server-sortable columns with `enableSorting: true`. */
export const columnHelper = <T extends RowData>() => createColumnHelper<TableFeatureSet, T>();

const PAGE_SIZES = [10, 20, 50, 100];

interface DataTableProps<T extends RowData> {
	columns: Columns<T>;
	data: T[] | undefined;
	isLoading?: boolean;
	error?: unknown;
	onRetry?: () => void;
	getRowId?: (row: T, index: number) => string;
	onRowClick?: (row: T) => void;
	rowClassName?: (row: T) => string | undefined;
	emptyText?: string;
	/** Server-side sorting (`field,DIR`). Omit to disable sorting entirely. */
	sorting?: SortingState;
	onSortingChange?: (s: SortingState) => void;
	/** Server-side pagination (zero-based page). Omit to hide the pager. */
	pagination?: {
		page: number;
		size: number;
		total: number;
		totalPages: number;
		onPageChange: (p: number) => void;
		onSizeChange?: (s: number) => void;
	};
	skeletonRows?: number;
	className?: string;
}

export function DataTable<T extends RowData>({
	columns,
	data,
	isLoading,
	error,
	onRetry,
	getRowId,
	onRowClick,
	rowClassName,
	emptyText,
	sorting = [],
	onSortingChange,
	pagination,
	skeletonRows = 8,
	className,
}: DataTableProps<T>) {
	'use no memo'; // table instance is mutable — keep React Compiler from memoising reads
	const table = useTable({
		features: tableFeatureSet,
		columns,
		data: data ?? [],
		getRowId,
		manualSorting: true,
		enableSorting: Boolean(onSortingChange),
		enableSortingRemoval: true,
		defaultColumn: { enableSorting: false },
		state: { sorting },
		onSortingChange: updater => {
			const next = typeof updater === 'function' ? updater(sorting) : updater;
			onSortingChange?.(next);
		},
	});

	const colCount = table.getAllLeafColumns().length;
	const rows = table.getRowModel().rows;

	return (
		<div className={cn('overflow-hidden rounded-xl border border-border bg-card', className)}>
			<Table>
				<TableHeader>
					{table.getHeaderGroups().map(group => (
						<TableRow key={group.id} className='hover:bg-transparent'>
							{group.headers.map(header => {
								const canSort = header.column.getCanSort();
								const dir = header.column.getIsSorted();
								return (
									<TableHead key={header.id} className={header.column.columnDef.meta?.className}>
										{header.isPlaceholder ? null : canSort ? (
											<button
												type='button'
												onClick={header.column.getToggleSortingHandler()}
												className='-mx-1 inline-flex items-center gap-1 rounded-xs px-1 hover:text-foreground'
											>
												<table.FlexRender header={header} />
												{dir === 'asc' ? (
													<ArrowUpIcon className='size-3.5' />
												) : dir === 'desc' ? (
													<ArrowDownIcon className='size-3.5' />
												) : (
													<ChevronsUpDownIcon className='size-3.5 opacity-40' />
												)}
											</button>
										) : (
											<table.FlexRender header={header} />
										)}
									</TableHead>
								);
							})}
						</TableRow>
					))}
				</TableHeader>
				<TableBody>
					{error ? (
						<TableRow className='hover:bg-transparent'>
							<TableCell colSpan={colCount}>
								<ErrorState error={error} onRetry={onRetry} />
							</TableCell>
						</TableRow>
					) : isLoading && !data ? (
						Array.from({ length: skeletonRows }).map((_, i) => (
							<TableRow key={i}>
								{Array.from({ length: colCount }).map((__, j) => (
									<TableCell key={j}>
										<Skeleton className='h-4 w-full max-w-32' />
									</TableCell>
								))}
							</TableRow>
						))
					) : rows.length === 0 ? (
						<TableRow className='hover:bg-transparent'>
							<TableCell colSpan={colCount}>
								<EmptyState text={emptyText} />
							</TableCell>
						</TableRow>
					) : (
						rows.map(row => (
							<TableRow
								key={row.id}
								data-clickable={Boolean(onRowClick)}
								onClick={onRowClick ? () => onRowClick(row.original) : undefined}
								className={cn(isLoading && 'opacity-60', rowClassName?.(row.original))}
							>
								{row.getAllCells().map(cell => (
									<TableCell key={cell.id} className={cell.column.columnDef.meta?.className}>
										<table.FlexRender cell={cell} />
									</TableCell>
								))}
							</TableRow>
						))
					)}
				</TableBody>
			</Table>
			{pagination && <Pager {...pagination} />}
		</div>
	);
}

function Pager({
	page,
	size,
	total,
	totalPages,
	onPageChange,
	onSizeChange,
}: NonNullable<DataTableProps<object>['pagination']>) {
	const t = useTranslations('common');
	const pages = Math.max(1, totalPages);
	return (
		<div className='flex flex-wrap items-center justify-between gap-3 border-t border-border-soft px-6 py-3 text-sm'>
			<span className='text-muted-foreground'>{t('total', { count: total })}</span>
			<div className='flex items-center gap-3'>
				{onSizeChange && (
					<div className='flex items-center gap-2'>
						<span className='text-muted-foreground'>{t('perPage')}</span>
						<Select value={String(size)} onValueChange={v => onSizeChange(Number(v))}>
							<SelectTrigger size='sm' className='w-20'>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{PAGE_SIZES.map(s => (
									<SelectItem key={s} value={String(s)}>
										{s}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				)}
				<span className='num text-muted-foreground'>
					{t('pageOf', { page: page + 1, total: pages })}
				</span>
				<div className='flex gap-1'>
					<Button
						variant='secondary'
						size='icon-sm'
						aria-label={t('prev')}
						disabled={page <= 0}
						onClick={() => onPageChange(page - 1)}
					>
						<ChevronLeftIcon />
					</Button>
					<Button
						variant='secondary'
						size='icon-sm'
						aria-label={t('next')}
						disabled={page + 1 >= pages}
						onClick={() => onPageChange(page + 1)}
					>
						<ChevronRightIcon />
					</Button>
				</div>
			</div>
		</div>
	);
}
