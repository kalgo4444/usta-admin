'use client';

import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { WandSparklesIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { catalogApi } from '@/entities/catalog/api';
import {
	buildCategoryTree,
	flattenTree,
	localized,
	SLUG_RE,
	slugify,
} from '@/entities/catalog/model';
import { invalidate } from '@/shared/api/invalidate';
import type { CatalogService, Category } from '@/shared/api/types';
import { useMutationErrorHandler } from '@/shared/api/use-mutation-error';
import { useLocale } from '@/shared/i18n/locale';
import { useEnumLabel } from '@/shared/i18n/use-enum';
import { bindFieldErrors, toOptionalNumber } from '@/shared/lib/form';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/kit/button';
import { Input } from '@/shared/ui/kit/input';
import { Textarea } from '@/shared/ui/kit/textarea';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/shared/ui/kit/select';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/kit/tabs';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/shared/ui/kit/dialog';
import { Field } from '@/shared/ui/field';

const LANGS = ['uz', 'ru', 'en'] as const;
type Lang = (typeof LANGS)[number];

interface Props {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	categories: Category[];
	service?: CatalogService;
	defaultCategoryId?: string;
}

export function ServiceFormDialog(props: Props) {
	const t = useTranslations('catalog');
	const [busy, setBusy] = useState(false);
	return (
		<Dialog open={props.open} onOpenChange={o => !busy && props.onOpenChange(o)}>
			<DialogContent className='max-w-xl'>
				<DialogHeader>
					<DialogTitle>{props.service ? t('editService') : t('newService')}</DialogTitle>
				</DialogHeader>
				<ServiceForm {...props} onBusy={setBusy} />
			</DialogContent>
		</Dialog>
	);
}

function ServiceForm({
	onOpenChange,
	categories,
	service,
	defaultCategoryId,
	onBusy,
}: Props & { onBusy: (b: boolean) => void }) {
	const t = useTranslations('catalog');
	const tc = useTranslations('common');
	const te = useTranslations('errors');
	const enumLabel = useEnumLabel();
	const locale = useLocale();
	const qc = useQueryClient();
	const onError = useMutationErrorHandler();
	const [autoSlug, setAutoSlug] = useState(!service);
	const [lang, setLang] = useState<Lang>('uz');

	const text = (max: number) => z.string().trim().max(max, te('maxLength', { max }));
	const schema = z.object({
		categoryId: z.string().min(1, te('required')),
		name: z.object({ uz: text(120).min(1, te('required')), ru: text(120), en: text(120) }),
		description: z.object({ uz: text(2000), ru: text(2000), en: text(2000) }),
		slug: z
			.string()
			.trim()
			.min(1, te('required'))
			.max(80, te('maxLength', { max: 80 }))
			.regex(SLUG_RE, t('slugInvalid')),
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
		categoryId: service?.categoryId ?? defaultCategoryId ?? '',
		name: { uz: service?.name?.uz ?? '', ru: service?.name?.ru ?? '', en: service?.name?.en ?? '' },
		description: {
			uz: service?.description?.uz ?? '',
			ru: service?.description?.ru ?? '',
			en: service?.description?.en ?? '',
		},
		slug: service?.slug ?? '',
		sortOrder: service?.sortOrder ?? 0,
		status: service?.status ?? 'ACTIVE',
	});

	const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: defaults() });

	const options = useMemo(() => flattenTree(buildCategoryTree(categories)), [categories]);
	const err = form.formState.errors;
	const desc = useWatch({ control: form.control, name: `description.${lang}` });
	const langHasError = (l: Lang) => Boolean(err.name?.[l] || err.description?.[l]);

	const submit = form.handleSubmit(
		async v => {
			const opt = (s: string) => s || undefined;
			const body = {
				categoryId: v.categoryId,
				slug: v.slug,
				name: { uz: v.name.uz, ru: opt(v.name.ru), en: opt(v.name.en) },
				description: {
					uz: opt(v.description.uz),
					ru: opt(v.description.ru),
					en: opt(v.description.en),
				},
				sortOrder: v.sortOrder,
				status: v.status,
			};
			onBusy(true);
			try {
				if (service?.id) await catalogApi.updateService(service.id, body);
				else await catalogApi.createService(body);
				toast.success(service ? t('savedToast') : t('createdToast'));
				await invalidate(qc, ['admin', 'services']);
				onOpenChange(false);
			} catch (e) {
				bindFieldErrors(onError(e), form.setError);
			} finally {
				onBusy(false);
			}
		},
		errors => {
			const bad = LANGS.find(l => errors.name?.[l] || errors.description?.[l]);
			if (bad) setLang(bad);
		},
	);

	return (
		<form onSubmit={submit} className='grid gap-4 sm:grid-cols-2'>
			<Field
				label={t('category')}
				required
				error={err.categoryId?.message}
				className='sm:col-span-2'
			>
				<Controller
					control={form.control}
					name='categoryId'
					render={({ field }) => (
						<Select value={field.value || undefined} onValueChange={field.onChange}>
							<SelectTrigger aria-invalid={Boolean(err.categoryId)}>
								<SelectValue placeholder={t('category')} />
							</SelectTrigger>
							<SelectContent>
								{options.map(o => (
									<SelectItem key={o.id} value={o.id!}>
										<span
											style={{ paddingLeft: o.depth * 16 }}
											className={cn(o.status === 'INACTIVE' && 'opacity-60')}
										>
											{localized(o.name, locale)}
										</span>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					)}
				/>
			</Field>

			<div className='space-y-4 sm:col-span-2'>
				<Tabs value={lang} onValueChange={v => setLang(v as Lang)}>
					<TabsList>
						{LANGS.map(l => (
							<TabsTrigger key={l} value={l} className={cn(langHasError(l) && 'text-destructive')}>
								{l.toUpperCase()}
								{l === 'uz' && <span className='text-destructive'>*</span>}
							</TabsTrigger>
						))}
					</TabsList>
				</Tabs>
				{LANGS.map(l => (
					<div key={l} className={cn('space-y-4', l !== lang && 'hidden')}>
						<Field
							label={t('nameLang', { lang: l })}
							htmlFor={`s-name-${l}`}
							required={l === 'uz'}
							error={err.name?.[l]?.message}
						>
							<Input
								id={`s-name-${l}`}
								{...form.register(`name.${l}`, {
									onChange: e =>
										l === 'uz' && autoSlug && form.setValue('slug', slugify(e.target.value)),
								})}
							/>
						</Field>
						<Field
							label={t('descriptionLang', { lang: l })}
							htmlFor={`s-desc-${l}`}
							counter={l === lang ? { value: desc, max: 2000 } : undefined}
							error={err.description?.[l]?.message}
						>
							<Textarea id={`s-desc-${l}`} rows={4} {...form.register(`description.${l}`)} />
						</Field>
					</div>
				))}
			</div>

			<Field
				label={t('slug')}
				htmlFor='s-slug'
				required
				error={err.slug?.message}
				hint={t('slugHint')}
				className='sm:col-span-2'
			>
				<div className='flex gap-2'>
					<Input
						id='s-slug'
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
							form.setValue('slug', slugify(form.getValues('name.uz')), { shouldValidate: true });
						}}
					>
						<WandSparklesIcon />
					</Button>
				</div>
			</Field>
			<Field label={t('sortOrder')} htmlFor='s-sort' error={err.sortOrder?.message}>
				<Input
					id='s-sort'
					type='number'
					min={0}
					max={100000}
					className='num'
					{...form.register('sortOrder', { setValueAs: toOptionalNumber })}
				/>
			</Field>
			<Field label={t('status')}>
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
					{form.formState.isSubmitting ? tc('loading') : service ? tc('save') : tc('create')}
				</Button>
			</DialogFooter>
		</form>
	);
}
