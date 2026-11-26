'use client';

import { useMemo, useState } from 'react';
import { ChevronRightIcon, FolderIcon, PencilIcon, PlusIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCategories } from '@/entities/catalog/api';
import { buildCategoryTree, localized, type CategoryNode } from '@/entities/catalog/model';
import { CatalogIcon } from '@/entities/catalog/ui';
import { CategoryFormDialog } from '@/features/category-form/category-form-dialog';
import { DeleteCatalogItemButton } from '@/features/delete-catalog-item/delete-catalog-item';
import type { Category } from '@/shared/api/types';
import { useLocale } from '@/shared/i18n/locale';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/kit/button';
import { Skeleton } from '@/shared/ui/kit/skeleton';
import { EmptyState, ErrorState } from '@/shared/ui/error-state';
import { PageHeader } from '@/shared/ui/page-header';
import { StatusBadge } from '@/shared/ui/status-badge';

type DialogState = { category?: Category; parentId?: string } | null;

export function CategoriesPage() {
	const t = useTranslations('catalog');
	const q = useCategories();
	const tree = useMemo(() => buildCategoryTree(q.data ?? []), [q.data]);
	const [expanded, setExpanded] = useState<Set<string>>(new Set());
	const [dialog, setDialog] = useState<DialogState>(null);

	const allIds = useMemo(() => (q.data ?? []).map(c => c.id!).filter(Boolean), [q.data]);
	const toggle = (id: string) =>
		setExpanded(s => {
			const n = new Set(s);
			if (n.has(id)) n.delete(id);
			else n.add(id);
			return n;
		});

	return (
		<div className='space-y-6'>
			<PageHeader
				title={t('categories')}
				actions={
					<>
						<Button variant='ghost' size='sm' onClick={() => setExpanded(new Set(allIds))}>
							{t('expandAll')}
						</Button>
						<Button variant='ghost' size='sm' onClick={() => setExpanded(new Set())}>
							{t('collapseAll')}
						</Button>
						<Button onClick={() => setDialog({})}>
							<PlusIcon /> {t('newCategory')}
						</Button>
					</>
				}
			/>
			<div className='overflow-hidden rounded-xl border border-border bg-card'>
				<div className='grid grid-cols-[1fr_120px_110px_96px] gap-3 border-b border-border px-6 py-3 text-xs font-semibold text-muted-foreground max-md:hidden'>
					<span>{t('name')}</span>
					<span>{t('slug')}</span>
					<span>{t('status')}</span>
					<span className='text-right'>{t('sortOrder')}</span>
				</div>
				{q.error ? (
					<ErrorState error={q.error} onRetry={() => q.refetch()} />
				) : !q.data ? (
					<div className='space-y-2 p-6'>
						{Array.from({ length: 6 }).map((_, i) => (
							<Skeleton key={i} className='h-9' />
						))}
					</div>
				) : tree.length === 0 ? (
					<EmptyState />
				) : (
					<ul>
						{tree.map(n => (
							<TreeRow
								key={n.id}
								node={n}
								expanded={expanded}
								onToggle={toggle}
								onEdit={c => setDialog({ category: c })}
								onAddChild={id => setDialog({ parentId: id })}
							/>
						))}
					</ul>
				)}
			</div>
			<CategoryFormDialog
				open={dialog !== null}
				onOpenChange={o => !o && setDialog(null)}
				categories={q.data ?? []}
				category={dialog?.category}
				defaultParentId={dialog?.parentId}
			/>
		</div>
	);
}

function TreeRow({
	node,
	expanded,
	onToggle,
	onEdit,
	onAddChild,
}: {
	node: CategoryNode;
	expanded: Set<string>;
	onToggle: (id: string) => void;
	onEdit: (c: Category) => void;
	onAddChild: (parentId: string) => void;
}) {
	const t = useTranslations('catalog');
	const tc = useTranslations('common');
	const locale = useLocale();
	const open = expanded.has(node.id!);
	const hasChildren = node.children.length > 0;
	const inactive = node.status === 'INACTIVE';

	return (
		<li>
			<div
				className={cn(
					'group grid grid-cols-[1fr_auto] items-center gap-3 border-b border-border-soft px-6 py-2.5 hover:bg-muted md:grid-cols-[1fr_120px_110px_96px]',
					inactive && 'opacity-55',
				)}
			>
				<div className='flex min-w-0 items-center gap-2' style={{ paddingLeft: node.depth * 24 }}>
					<button
						type='button'
						onClick={() => hasChildren && onToggle(node.id!)}
						className={cn(
							'flex size-6 items-center justify-center rounded-xs',
							hasChildren ? 'hover:bg-secondary' : 'invisible',
						)}
						aria-label={open ? t('collapseAll') : t('expandAll')}
					>
						<ChevronRightIcon className={cn('size-4 transition-transform', open && 'rotate-90')} />
					</button>
					<CatalogIcon url={node.iconUrl} fallback={FolderIcon} />
					<span className='truncate font-medium'>{localized(node.name, locale)}</span>
					{hasChildren && (
						<span className='text-xs text-subtle-foreground'>
							{t('children', { count: node.children.length })}
						</span>
					)}
					<span className='ml-auto flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 max-md:opacity-100'>
						<Button
							variant='ghost'
							size='icon-sm'
							title={t('newCategory')}
							aria-label={t('newCategory')}
							onClick={() => onAddChild(node.id!)}
						>
							<PlusIcon />
						</Button>
						<Button
							variant='ghost'
							size='icon-sm'
							title={tc('edit')}
							aria-label={tc('edit')}
							onClick={() => onEdit(node)}
						>
							<PencilIcon />
						</Button>
						<DeleteCatalogItemButton
							kind='category'
							id={node.id!}
							name={localized(node.name, locale)}
						/>
					</span>
				</div>
				<span className='truncate num text-xs text-muted-foreground max-md:hidden'>
					{node.slug}
				</span>
				<span className='max-md:hidden'>
					<StatusBadge kind='CatalogStatus' value={node.status} />
				</span>
				<span className='text-right num text-sm text-muted-foreground max-md:hidden'>
					{node.sortOrder ?? 0}
				</span>
			</div>
			{open && hasChildren && (
				<ul>
					{node.children.map(c => (
						<TreeRow
							key={c.id}
							node={c}
							expanded={expanded}
							onToggle={onToggle}
							onEdit={onEdit}
							onAddChild={onAddChild}
						/>
					))}
				</ul>
			)}
		</li>
	);
}
