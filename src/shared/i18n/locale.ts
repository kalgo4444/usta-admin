'use client';

import { useSyncExternalStore } from 'react';

export const LOCALES = ['uz', 'ru'] as const;
export type Locale = (typeof LOCALES)[number];
const DEFAULT_LOCALE: Locale = 'uz';

const KEY = 'usta-admin-locale';
const listeners = new Set<() => void>();

function read(): Locale {
	if (typeof window === 'undefined') return DEFAULT_LOCALE;
	const v = window.localStorage.getItem(KEY);
	return (LOCALES as readonly string[]).includes(v ?? '') ? (v as Locale) : DEFAULT_LOCALE;
}

export const localeStore = {
	get: read,
	set(l: Locale) {
		window.localStorage.setItem(KEY, l);
		document.documentElement.lang = l;
		listeners.forEach(fn => fn());
	},
	subscribe(l: () => void) {
		listeners.add(l);
		return () => listeners.delete(l);
	},
};

export function useLocale(): Locale {
	return useSyncExternalStore(localeStore.subscribe, read, () => DEFAULT_LOCALE);
}
