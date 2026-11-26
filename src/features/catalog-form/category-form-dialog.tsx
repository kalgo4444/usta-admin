'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import {
	catalogApi,
	catalogKeys,
	buildCategoryTree,
	flattenTree,
	iconForSave,
	localized,
	selfAndDescendants,
	slugify,
	IconPicker,
} from '@/entities/catalog';
import { invalidate } from '@/shared/api/invalidate';
import type { Category } from '@/shared/api/types';
import { useMutationErrorHandler } from '@/shared/api/use-mutation-error';
import { useLocale } from '@/shared/i18n/locale';
import { bindFieldErrors, toOptionalNumber } from '@/shared/lib/form';
import { Button } from '@/shared/ui/kit/button';
import { Input } from '@/shared/ui/kit/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/shared/ui/kit/select';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/shared/ui/kit/dialog';
import { Field } from '@/shared/ui/field';
import { CatalogMedia } from './catalog-media';
import { SlugField, StatusSelect } from './fields';
import { catalogCommonFields, useCatalogSchemaMessages, useIconKeys } from './schema';

const ROOT = '__root';

interface Props {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	categories: Category[];
	/** Edit mode when provided. */
	category?: Category;
	defaultParentId?: string;
}

export function CategoryFormDialog(props: Props) {
	const t = useTranslations('catalog');
	const [busy, setBusy] = useState(false);
	return (
		<Dialog open={props.open} onOpenChange={o => !busy && props.onOpenChange(o)}>
			<DialogContent className='max-w-xl'>
				<DialogHeader>
					<DialogTitle>{props.category ? t('editCategory') : t('newCategory')}</DialogTitle>
				</DialogHeader>
				{/* mounted per open → fresh defaults, no reset effects */}
				<CategoryForm {...props} onBusy={setBusy} />
			</DialogContent>
		</Dialog>
	);
}

function CategoryForm({
	onOpenChange,
	categories,
	category,
	defaultParentId,
	onBusy,
}: Props & { onBusy: (b: boolean) => void }) {
	const t = useTranslations('catalog');
	const tc = useTranslations('common');
	const te = useTranslations('errors');
	const messages = useCatalogSchemaMessages();
	const locale = useLocale();
	const qc = useQueryClient();
	const onError = useMutationErrorHandler();
	const [autoSlug, setAutoSlug] = useState(!category);
	const [customIcon, setCustomIcon] = useState(Boolean(category?.customIcon));
	const iconKeys = useIconKeys();

	// uz, ru, en are required (2–120); uzCyrl is transliterated from uz when empty.
	const name = z
		.string()
		.trim()
		.min(1, te('required'))
		.min(2, te('minLength', { min: 2 }))
		.max(120, te('maxLength', { max: 120 }));
	const schema = z.object({
		nameUz: name,
		nameRu: name,
		nameEn: name,
		nameUzCyrl: z
			.string()
			.trim()
			.max(120, te('maxLength', { max: 120 })),
		parentId: z.string(),
		...catalogCommonFields(messages, iconKeys),
	});
	type Values = z.infer<typeof schema>;

	const defaults = (): Values => ({
		nameUz: category?.name?.uz ?? '',
		nameRu: category?.name?.ru ?? '',
		nameEn: category?.name?.en ?? '',
		nameUzCyrl: category?.name?.uzCyrl ?? '',
		slug: category?.slug ?? '',
		parentId: category ? (category.parentId ?? ROOT) : (defaultParentId ?? ROOT),
		icon: category?.icon ?? '',
		sortOrder: category?.sortOrder ?? 0,
		status: category?.status ?? 'ACTIVE',
	});

	const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: defaults() });

	const categoryId = category?.id;
	const blocked = categoryId ? selfAndDescendants(categories, categoryId) : new Set<string>();
	const options = flattenTree(buildCategoryTree(categories));

	const submit = form.handleSubmit(async v => {
		const body = {
			name: { uz: v.nameUz, ru: v.nameRu, en: v.nameEn, uzCyrl: v.nameUzCyrl || undefined },
			slug: v.slug,
			parentId: v.parentId === ROOT ? undefined : v.parentId,
			icon: iconForSave(v.icon, category?.icon, customIcon),
			sortOrder: v.sortOrder,
			status: v.status,
		};
		onBusy(true);
		try {
			if (category?.id) await catalogApi.updateCategory(category.id, body);
			else await catalogApi.createCategory(body);
			toast.success(category ? t('savedToast') : t('createdToast'));
			await invalidate(qc, catalogKeys.categories);
			onOpenChange(false);
		} catch (e) {
			bindFieldErrors(onError(e), form.setError);
		} finally {
			onBusy(false);
		}
	});

	const err = form.formState.errors;

	return (
		<form onSubmit={submit} className='grid gap-4 sm:grid-cols-2'>
			<Field
				label={t('nameLang', { lang: 'uz' })}
				htmlFor='c-uz'
				required
				error={err.nameUz?.message}
				className='sm:col-span-2'
			>
				<Input
					id='c-uz'
					autoFocus
					{...form.register('nameUz', {
						// auto-slug from the Uzbek name until the slug is edited by hand
						onChange: e => autoSlug && form.setValue('slug', slugify(e.target.value)),
					})}
				/>
			</Field>
			<Field
				label={t('nameLang', { lang: 'uz-Cyrl' })}
				htmlFor='c-uzc'
				hint={t('uzCyrlHint')}
				error={err.nameUzCyrl?.message}
				className='sm:col-span-2'
			>
				<Input id='c-uzc' {...form.register('nameUzCyrl')} />
			</Field>
			<Field
				label={t('nameLang', { lang: 'ru' })}
				htmlFor='c-ru'
				required
				error={err.nameRu?.message}
			>
				<Input id='c-ru' {...form.register('nameRu')} />
			</Field>
			<Field
				label={t('nameLang', { lang: 'en' })}
				htmlFor='c-en'
				required
				error={err.nameEn?.message}
			>
				<Input id='c-en' {...form.register('nameEn')} />
			</Field>
			<SlugField
				id='c-slug'
				registration={form.register('slug', { onChange: () => setAutoSlug(false) })}
				onGenerate={() => {
					setAutoSlug(true);
					form.setValue('slug', slugify(form.getValues('nameUz')), { shouldValidate: true });
				}}
				error={err.slug?.message}
			/>
			<Field label={t('parent')} className='sm:col-span-2' error={err.parentId?.message}>
				<Controller
					control={form.control}
					name='parentId'
					render={({ field }) => (
						<Select value={field.value} onValueChange={field.onChange}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={ROOT}>{t('root')}</SelectItem>
								{options.map(o => (
									<SelectItem key={o.id} value={o.id!} disabled={blocked.has(o.id!)}>
										<span style={{ paddingLeft: o.depth * 16 }}>{localized(o.name, locale)}</span>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					)}
				/>
			</Field>
			<Field label={t('icon')} error={err.icon?.message}>
				<Controller
					control={form.control}
					name='icon'
					render={({ field }) => (
						<IconPicker value={field.value} onChange={field.onChange} invalid={Boolean(err.icon)} />
					)}
				/>
			</Field>
			<Field label={t('sortOrder')} htmlFor='c-sort' error={err.sortOrder?.message}>
				<Input
					id='c-sort'
					type='number'
					min={0}
					max={100000}
					className='num'
					{...form.register('sortOrder', { setValueAs: toOptionalNumber })}
				/>
			</Field>
			<Field label={t('status')} className='sm:col-span-2' hint={t('statusHint')}>
				<Controller
					control={form.control}
					name='status'
					render={({ field }) => <StatusSelect value={field.value} onChange={field.onChange} />}
				/>
			</Field>
			{category?.id && (
				<div className='sm:col-span-2'>
					<CatalogMedia
						kind='categories'
						item={category}
						onChange={c => setCustomIcon(Boolean(c.customIcon))}
					/>
				</div>
			)}
			<DialogFooter className='sm:col-span-2'>
				<Button type='button' variant='secondary' onClick={() => onOpenChange(false)}>
					{tc('cancel')}
				</Button>
				<Button type='submit' disabled={form.formState.isSubmitting}>
					{form.formState.isSubmitting ? tc('loading') : category ? tc('save') : tc('create')}
				</Button>
			</DialogFooter>
		</form>
	);
}
