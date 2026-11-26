import { useTranslations } from 'next-intl';
import { z } from 'zod';
import { SLUG_RE, useCatalogIcons } from '@/entities/catalog';

export interface CatalogSchemaMessages {
	required: string;
	slugInvalid: string;
	unknownIcon: string;
	invalidNumber: string;
	maxLength: (max: number) => string;
}

/**
 * Fields shared by the category and service forms. `iconKeys` is null until the icon list
 * has loaded; any key is accepted until then.
 */
export function catalogCommonFields(
	m: CatalogSchemaMessages,
	iconKeys: ReadonlySet<string> | null,
) {
	return {
		slug: z
			.string()
			.trim()
			.min(1, m.required)
			.max(80, m.maxLength(80))
			.regex(SLUG_RE, m.slugInvalid),
		icon: z.string().refine(k => !k || !iconKeys || iconKeys.has(k), m.unknownIcon),
		sortOrder: z.number({ error: m.invalidNumber }).int().min(0).max(100000).optional(),
		status: z.enum(['ACTIVE', 'INACTIVE']),
	};
}

/** Known icon keys, or null while the icon list is loading. */
export function useIconKeys(): ReadonlySet<string> | null {
	const { data } = useCatalogIcons();
	if (!data) return null;
	return new Set(data.flatMap(i => (i.key ? [i.key] : [])));
}

export function useCatalogSchemaMessages(): CatalogSchemaMessages {
	const t = useTranslations('catalog');
	const te = useTranslations('errors');
	return {
		required: te('required'),
		slugInvalid: t('slugInvalid'),
		unknownIcon: t('unknownIcon'),
		invalidNumber: te('invalidNumber'),
		maxLength: max => te('maxLength', { max }),
	};
}
