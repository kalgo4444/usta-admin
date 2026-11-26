'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { toApiError } from './errors';

/** 409 codes that mean "the data changed under you" — anything else is a business rule. */
const STALE_CODES = new Set([
	'CONFLICT',
	'CONCURRENT_MODIFICATION',
	'INVALID_STATE',
	'INVALID_STATUS_TRANSITION',
	'VERIFICATION_INVALID_STATE',
	'USER_DELETED',
]);

/**
 * Standard mutation error handling (plan §9): stale 409 → toast + refetch admin data,
 * other 409 (USER_HAS_DEBT, SLUG_TAKEN, …) and 403 → backend message, others → backend
 * message. Returns the normalised error so forms can bind `fieldErrors`.
 */
export function useMutationErrorHandler() {
	const t = useTranslations('errors');
	const qc = useQueryClient();
	return (e: unknown) => {
		const err = toApiError(e);
		if (err.status === 409 && (!err.code || STALE_CODES.has(err.code))) {
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
