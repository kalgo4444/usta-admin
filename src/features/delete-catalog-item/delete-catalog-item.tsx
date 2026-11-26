'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Trash2Icon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { catalogApi } from '@/entities/catalog/api';
import { useAccess } from '@/entities/user/api';
import { toApiError } from '@/shared/api/errors';
import { invalidate } from '@/shared/api/invalidate';
import { useMutationErrorHandler } from '@/shared/api/use-mutation-error';
import { Button } from '@/shared/ui/kit/button';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';

/**
 * Delete (archive) a category or service — CATALOG + DELETE. A non-empty category first
 * answers 409 CATEGORY_NOT_EMPTY with its counts; the dialog then asks again, with a
 * typed confirmation, and retries with `?cascade=true` (the whole branch goes).
 */
export function DeleteCatalogItemButton({
	kind,
	id,
	name,
}: {
	kind: 'category' | 'service';
	id: string;
	name: string;
}) {
	const t = useTranslations('catalog');
	const tc = useTranslations('common');
	const qc = useQueryClient();
	const onError = useMutationErrorHandler();
	const { can } = useAccess();
	const [open, setOpen] = useState(false);
	/** Backend's CATEGORY_NOT_EMPTY message once the first attempt was refused. */
	const [cascade, setCascade] = useState<string | null>(null);

	if (!can('CATALOG', 'DELETE')) return null;

	const change = (o: boolean) => {
		setOpen(o);
		if (!o) setCascade(null);
	};

	const confirm = async () => {
		try {
			if (kind === 'service') await catalogApi.deleteService(id);
			else await catalogApi.deleteCategory(id, cascade !== null);
		} catch (e) {
			const err = toApiError(e);
			if (kind === 'category' && cascade === null && err.code === 'CATEGORY_NOT_EMPTY') {
				setCascade(err.message);
			} else {
				onError(e);
			}
			throw e;
		}
		toast.success(t('deletedToast'));
		await invalidate(qc, ['admin', 'categories'], ['admin', 'services']);
	};

	return (
		<>
			<Button
				variant='ghost'
				size='icon-sm'
				className='text-destructive'
				title={tc('delete')}
				aria-label={tc('delete')}
				onClick={() => setOpen(true)}
			>
				<Trash2Icon />
			</Button>
			<ConfirmDialog
				open={open}
				onOpenChange={change}
				destructive
				title={
					cascade !== null
						? t('deleteCascadeTitle')
						: kind === 'service'
							? t('deleteServiceTitle')
							: t('deleteCategoryTitle')
				}
				description={
					cascade !== null
						? `${cascade} ${t('deleteCascadeHint')}`
						: kind === 'service'
							? t('deleteServiceDescription', { name })
							: t('deleteCategoryDescription', { name })
				}
				typeToConfirm={cascade !== null ? 'DELETE' : undefined}
				confirmLabel={tc('delete')}
				onConfirm={confirm}
			/>
		</>
	);
}
