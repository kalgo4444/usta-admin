'use client';

import { useSyncExternalStore } from 'react';

/**
 * Counts requests that have been pending longer than SLOW_MS. Render's free tier needs
 * 30–60 s to wake, so a non-zero count drives the "server is waking up" banner.
 */
const SLOW_MS = 4_000;

let slow = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());

export function trackRequest(): () => void {
	let fired = false;
	const timer = setTimeout(() => {
		fired = true;
		slow++;
		emit();
	}, SLOW_MS);
	return () => {
		clearTimeout(timer);
		if (fired) {
			slow = Math.max(0, slow - 1);
			emit();
		}
	};
}

export function useServerWaking() {
	return useSyncExternalStore(
		l => {
			listeners.add(l);
			return () => listeners.delete(l);
		},
		() => slow > 0,
		() => false,
	);
}
