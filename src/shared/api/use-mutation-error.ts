'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { toApiError } from './errors';

/**
 * Standard mutation error handling (plan §9): 409 → toast + refetch admin data,
 * 403 → "no access", others → backend message. Returns the normalised error so forms
 * can bind `fieldErrors`.
 */
export function useMutationErrorHandler() {
	const t = useTranslations('errors');
	const qc = useQueryClient();
	return (e: unknown) => {
		const err = toApiError(e);
		if (err.status === 409) {
			toast.warning(t('conflict'), { description: err.message });
			void qc.invalidateQueries({ queryKey: ['admin'] });
		} else if (err.status === 403) {
			toast.error(t('forbidden'), { description: err.message });
		} else if (err.isNetwork) {
			toast.error(t('network'), { description: t('serverWakingHint') });
		} else if (Object.keys(err.fieldErrors).length) {
			toast.error(t('validation'), { description: err.message });
		} else {
			toast.error(err.message || t('generic'));
		}
		return err;
	};
}
