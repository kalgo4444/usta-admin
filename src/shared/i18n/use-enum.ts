'use client';

import { useTranslations } from 'next-intl';
import type { EnumName } from '@/shared/lib/status';

type EnumKind = EnumName | 'DocumentType';

/** Translate an API enum value, falling back to the raw value for unknown ones. */
export function useEnumLabel() {
	const t = useTranslations('enums');
	return (kind: EnumKind, value: string | null | undefined) => {
		if (!value) return '—';
		const key = `${kind}.${value}` as Parameters<typeof t>[0];
		return t.has(key) ? t(key) : value;
	};
}
