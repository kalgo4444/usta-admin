'use client';

import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { WandSparklesIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { catalogApi, catalogKeys } from '@/entities/catalog/api';
import {
	buildCategoryTree,
	flattenTree,
	localized,
	selfAndDescendants,
	SLUG_RE,
	slugify,
} from '@/entities/catalog/model';
import { invalidate } from '@/shared/api/invalidate';
import type { Category } from '@/shared/api/types';
import { useMutationErrorHandler } from '@/shared/api/use-mutation-error';
import { useLocale } from '@/shared/i18n/locale';
import { useEnumLabel } from '@/shared/i18n/use-enum';
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
	const enumLabel = useEnumLabel();
	const locale = useLocale();
	const qc = useQueryClient();
	const onError = useMutationErrorHandler();
	const [autoSlug, setAutoSlug] = useState(!category);

	const schema = z.object({
		nameUz: z
			.string()
			.trim()
			.min(1, te('required'))
			.max(120, te('maxLength', { max: 120 })),
		nameRu: z
			.string()
			.trim()
			.max(120, te('maxLength', { max: 120 })),
		nameEn: z
			.string()
			.trim()
			.max(120, te('maxLength', { max: 120 })),
		slug: z
			.string()
			.trim()
			.min(1, te('required'))
			.max(80, te('maxLength', { max: 80 }))
			.regex(SLUG_RE, t('slugInvalid')),
		parentId: z.string(),
		icon: z
			.string()
			.trim()
			.max(255, te('maxLength', { max: 255 })),
		sortOrder: z
			.number({ error: te('invalidNumber') })
			.int()
			.min(0)
			.max(100000)
			.optional(),
		status: z.enum(['ACTIVE', 'INACTIVE']),
	});
	type Values = z.infer<typeof schema>;

	const defaults = (): Values => ({
		nameUz: category?.name?.uz ?? '',
		nameRu: category?.name?.ru ?? '',
		nameEn: category?.name?.en ?? '',
		slug: category?.slug ?? '',
		parentId: category ? (category.parentId ?? ROOT) : (defaultParentId ?? ROOT),
		icon: category?.icon ?? '',
		sortOrder: category?.sortOrder ?? 0,
		status: category?.status ?? 'ACTIVE',
	});

	const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: defaults() });

	const categoryId = category?.id;
	const blocked = useMemo(
		() => (categoryId ? selfAndDescendants(categories, categoryId) : new Set<string>()),
		[categories, categoryId],
	);
	const options = useMemo(() => flattenTree(buildCategoryTree(categories)), [categories]);

	const submit = form.handleSubmit(async v => {
		const body = {
			name: { uz: v.nameUz, ru: v.nameRu || undefined, en: v.nameEn || undefined },
			slug: v.slug,
			parentId: v.parentId === ROOT ? undefined : v.parentId,
			icon: v.icon || undefined,
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
			<Field label={t('nameLang', { lang: 'ru' })} htmlFor='c-ru' error={err.nameRu?.message}>
				<Input id='c-ru' {...form.register('nameRu')} />
			</Field>
			<Field label={t('nameLang', { lang: 'en' })} htmlFor='c-en' error={err.nameEn?.message}>
				<Input id='c-en' {...form.register('nameEn')} />
			</Field>
			<Field
				label={t('slug')}
				htmlFor='c-slug'
				required
				error={err.slug?.message}
				hint={t('slugHint')}
				className='sm:col-span-2'
			>
				<div className='flex gap-2'>
					<Input
						id='c-slug'
						className='num'
						{...form.register('slug', { onChange: () => setAutoSlug(false) })}
					/>
					<Button
						type='button'
						variant='secondary'
						size='icon'
						className='size-12'
						aria-label={t('generate')}
						title={t('generate')}
						onClick={() => {
							setAutoSlug(true);
							form.setValue('slug', slugify(form.getValues('nameUz')), { shouldValidate: true });
						}}
					>
						<WandSparklesIcon />
					</Button>
				</div>
			</Field>
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
			<Field label={t('icon')} htmlFor='c-icon' error={err.icon?.message}>
				<Input id='c-icon' {...form.register('icon')} placeholder='wrench' />
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
			<Field label={t('status')} className='sm:col-span-2' hint={t('noDelete')}>
				<Controller
					control={form.control}
					name='status'
					render={({ field }) => (
						<Select value={field.value} onValueChange={field.onChange}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{(['ACTIVE', 'INACTIVE'] as const).map(s => (
									<SelectItem key={s} value={s}>
										{enumLabel('CatalogStatus', s)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					)}
				/>
			</Field>
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
