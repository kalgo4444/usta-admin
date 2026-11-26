'use client';

import { WandSparklesIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { useEnumLabel } from '@/shared/i18n/use-enum';
import { Field } from '@/shared/ui/field';
import { Button } from '@/shared/ui/kit/button';
import { Input } from '@/shared/ui/kit/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/shared/ui/kit/select';

/** Slug input with a "generate from the Uzbek name" button. */
export function SlugField({
	id,
	registration,
	onGenerate,
	error,
}: {
	id: string;
	registration: UseFormRegisterReturn<'slug'>;
	onGenerate: () => void;
	error?: string;
}) {
	const t = useTranslations('catalog');
	return (
		<Field
			label={t('slug')}
			htmlFor={id}
			required
			error={error}
			hint={t('slugHint')}
			className='sm:col-span-2'
		>
			<div className='flex gap-2'>
				<Input id={id} className='num' {...registration} />
				<Button
					type='button'
					variant='secondary'
					size='icon'
					className='size-12'
					aria-label={t('generate')}
					title={t('generate')}
					onClick={onGenerate}
				>
					<WandSparklesIcon />
				</Button>
			</div>
		</Field>
	);
}

const STATUSES = ['ACTIVE', 'INACTIVE'] as const;
type CatalogStatus = (typeof STATUSES)[number];

export function StatusSelect({
	value,
	onChange,
}: {
	value: CatalogStatus;
	onChange: (v: CatalogStatus) => void;
}) {
	const enumLabel = useEnumLabel();
	return (
		<Select value={value} onValueChange={v => onChange(v as CatalogStatus)}>
			<SelectTrigger>
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				{STATUSES.map(s => (
					<SelectItem key={s} value={s}>
						{enumLabel('CatalogStatus', s)}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
