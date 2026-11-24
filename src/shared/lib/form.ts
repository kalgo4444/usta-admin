import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import type { ApiError } from '@/shared/api/errors';

/** `""` → undefined, otherwise Number (for optional numeric inputs). */
export const toOptionalNumber = (v: unknown) =>
	v === '' || v === null || v === undefined ? undefined : Number(v);

/** Map backend field errors (400) onto RHF fields. */
export function bindFieldErrors<T extends FieldValues>(
	err: ApiError,
	setError: UseFormSetError<T>,
) {
	for (const [field, message] of Object.entries(err.fieldErrors))
		setError(field as Path<T>, { message });
}
