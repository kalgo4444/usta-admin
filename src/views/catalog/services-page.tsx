'use client';

import { useMemo, useState } from 'react';
import { PencilIcon, PlusIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCategories, useServices } from '@/entities/catalog/api';
import { buildCategoryTree, flattenTree, localized } from '@/entities/catalog/model';
import { CatalogIcon } from '@/entities/catalog/ui';
import { DeleteCatalogItemButton } from '@/features/delete-catalog-item/delete-catalog-item';
import { ServiceFormDialog } from '@/features/service-form/service-form-dialog';
import type { CatalogService } from '@/shared/api/types';
import { useLocale } from '@/shared/i18n/locale';
import { formatDate } from '@/shared/lib/format';
import { useTableParams } from '@/shared/lib/use-table-params';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/kit/button';
import { columnHelper, DataTable } from '@/shared/ui/data-table';
import { PageHeader } from '@/shared/ui/page-header';
import { StatusBadge } from '@/shared/ui/status-badge';

const col = columnHelper<CatalogService>();

export function ServicesPage() {
	const t = useTranslations('catalog');
	const tc = useTranslations('common');
	const locale = useLocale();
	const tp = useTableParams({ filters: ['categoryId'] as const });
	const categoryId = tp.apiFilters.categoryId;
	const categories = useCategories();
	const q = useServices({ categoryId });
	const [dialog, setDialog] = useState<{ service?: CatalogService } | null>(null);

	const flat = useMemo(
		() => flattenTree(buildCategoryTree(categories.data ?? [])),
		[categories.data],
	);
	const catName = useMemo(() => {
		const m = new Map<string, string>();
		for (const c of categories.data ?? []) if (c.id) m.set(c.id, localized(c.name, locale));
		return m;
	}, [categories.data, locale]);
	const rows = useMemo(
		() => [...(q.data ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
		[q.data],
	);

	const columns = [
		col.display({
			id: 'media',
			header: '',
			cell: ({ row }) => (
				<span className='flex items-center gap-2'>
					<CatalogIcon url={row.original.iconUrl} className='size-5' />
					{row.original.imageUrl && (
						// eslint-disable-next-line @next/next/no-img-element -- presigned URL
						<img src={row.original.imageUrl} alt='' className='size-8 rounded-sm object-cover' />
					)}
				</span>
			),
		}),
		col.accessor(r => localized(r.name, locale), {
			id: 'name',
			header: t('name'),
			cell: ({ row, getValue }) => (
				<span className={cn('font-medium', row.original.status === 'INACTIVE' && 'opacity-60')}>
					{getValue()}
				</span>
			),
		}),
		col.accessor('slug', {
			header: t('slug'),
			cell: c => <span className='num text-xs text-muted-foreground'>{c.getValue()}</span>,
		}),
		col.accessor('categoryId', {
			header: t('category'),
			cell: c => catName.get(c.getValue() ?? '') ?? '—',
		}),
		col.accessor('sortOrder', {
			header: t('sortOrder'),
			cell: c => <span className='num'>{c.getValue() ?? 0}</span>,
		}),
		col.accessor('status', {
			header: t('status'),
			cell: c => <StatusBadge kind='CatalogStatus' value={c.getValue()} />,
		}),
		col.accessor('updatedAt', {
			header: t('updatedAt'),
			cell: c => <span className='num text-muted-foreground'>{formatDate(c.getValue())}</span>,
		}),
		col.display({
			id: 'actions',
			header: '',
			meta: { className: 'text-right' },
			cell: ({ row }) => (
				<span className='inline-flex gap-1'>
					<Button
						variant='ghost'
						size='icon-sm'
						aria-label={tc('edit')}
						onClick={() => setDialog({ service: row.original })}
					>
						<PencilIcon />
					</Button>
					<DeleteCatalogItemButton
						kind='service'
						id={row.original.id!}
						name={localized(row.original.name, locale)}
					/>
				</span>
			),
		}),
	];

	return (
		<div className='space-y-6'>
			<PageHeader
				title={t('services')}
				actions={
					<Button onClick={() => setDialog({})}>
						<PlusIcon /> {t('newService')}
					</Button>
				}
			/>
			<div className='grid gap-4 lg:grid-cols-[260px_1fr]'>
				<aside className='h-fit rounded-xl border border-border bg-card p-2 lg:sticky lg:top-24'>
					<button
						type='button'
						onClick={() => tp.setFilter('categoryId', undefined)}
						className={cn(
							'w-full rounded-pill px-3 py-2 text-left text-sm',
							!categoryId ? 'bg-secondary font-semibold' : 'hover:bg-muted',
						)}
					>
						{t('allCategories')}
					</button>
					<div className='max-h-[60vh] overflow-y-auto'>
						{flat.map(c => (
							<button
								key={c.id}
								type='button'
								onClick={() => tp.setFilter('categoryId', c.id)}
								style={{ paddingLeft: 12 + c.depth * 16 }}
								className={cn(
									'w-full truncate rounded-pill py-2 pr-3 text-left text-sm',
									categoryId === c.id ? 'bg-secondary font-semibold' : 'hover:bg-muted',
									c.status === 'INACTIVE' && 'opacity-55',
								)}
							>
								{localized(c.name, locale)}
							</button>
						))}
					</div>
				</aside>
				<DataTable
					columns={columns}
					data={q.data ? rows : undefined}
					isLoading={q.isFetching}
					error={q.error}
					onRetry={() => q.refetch()}
					getRowId={r => r.id!}
				/>
			</div>
			<ServiceFormDialog
				open={dialog !== null}
				onOpenChange={o => !o && setDialog(null)}
				categories={categories.data ?? []}
				service={dialog?.service}
				defaultCategoryId={categoryId}
			/>
		</div>
	);
}
