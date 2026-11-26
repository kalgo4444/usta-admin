'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ImageIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { catalogApi, type CatalogKind, CatalogIcon } from '@/entities/catalog';
import { invalidate } from '@/shared/api/invalidate';
import type { CatalogService, Category } from '@/shared/api/types';
import { useMutationErrorHandler } from '@/shared/api/use-mutation-error';
import { ImageUpload, type ImageRules } from '@/shared/ui/image-upload';
import { RemoteImage } from '@/shared/ui/remote-image';

const IMAGE_RULES: ImageRules = {
	types: ['image/jpeg', 'image/png', 'image/webp'],
	maxBytes: 5 * 1024 * 1024,
	minPx: 200,
	maxPx: 4096,
};
const ICON_RULES: ImageRules = {
	types: ['image/png', 'image/webp'],
	maxBytes: 512 * 1024,
	minPx: 48,
	maxPx: 1024,
	square: true,
};

type Item = Pick<Category | CatalogService, 'id' | 'imageUrl' | 'iconUrl' | 'customIcon'>;

/**
 * Image and own-icon upload for an existing category/service. Changes apply at once
 * (separate endpoints), independent of the form's Save.
 */
export function CatalogMedia({
	kind,
	item,
	onChange,
}: {
	kind: CatalogKind;
	item: Item;
	/** Lets the form know about an uploaded icon (saving an icon key would remove it). */
	onChange?: (item: Item) => void;
}) {
	const t = useTranslations('catalog');
	const tu = useTranslations('upload');
	const qc = useQueryClient();
	const onError = useMutationErrorHandler();
	const [current, setCurrent] = useState<Item>(item);
	const id = item.id;
	if (!id) return null;

	const run = (call: Promise<Category | CatalogService>, msg: string) =>
		call.then(
			res => {
				setCurrent(res);
				onChange?.(res);
				toast.success(msg);
				return invalidate(
					qc,
					kind === 'categories' ? ['admin', 'categories'] : ['admin', 'services'],
				);
			},
			e => {
				onError(e);
				throw e;
			},
		);

	return (
		<section className='space-y-4 border-t border-border pt-5'>
			<h3 className='text-sm font-semibold'>{t('media')}</h3>
			<ImageUpload
				label={t('image')}
				hasValue={Boolean(current.imageUrl)}
				rules={IMAGE_RULES}
				preview={
					current.imageUrl ? (
						<RemoteImage eager src={current.imageUrl} alt='' className='size-full object-cover' />
					) : (
						<ImageIcon className='size-5 text-muted-foreground' />
					)
				}
				onUpload={file => run(catalogApi.uploadMedia(kind, id, 'image', file), tu('uploadedToast'))}
				onRemove={() => run(catalogApi.removeMedia(kind, id, 'image'), tu('removedToast'))}
			/>
			<ImageUpload
				label={t('customIcon')}
				hasValue={Boolean(current.customIcon)}
				rules={ICON_RULES}
				preview={<CatalogIcon url={current.iconUrl} className='size-8' />}
				onUpload={file => run(catalogApi.uploadMedia(kind, id, 'icon', file), tu('uploadedToast'))}
				onRemove={() => run(catalogApi.removeMedia(kind, id, 'icon'), tu('removedToast'))}
			/>
			<p className='text-xs text-muted-foreground'>{t('customIconHint')}</p>
		</section>
	);
}
