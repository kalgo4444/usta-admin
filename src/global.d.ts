/* eslint-disable @typescript-eslint/no-unused-vars -- augmentation must repeat the generic params */
import type uz from '@/shared/i18n/messages/uz.json';
import type { CellData, RowData, TableFeatures } from '@tanstack/table-core';

declare module 'next-intl' {
	interface AppConfig {
		Messages: typeof uz;
	}
}

declare module '@tanstack/table-core' {
	interface ColumnMeta<
		TFeatures extends TableFeatures,
		TData extends RowData,
		TValue extends CellData = CellData,
	> {
		className?: string;
	}
}
