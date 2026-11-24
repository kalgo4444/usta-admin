'use client';

import { useEffect, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NextIntlClientProvider } from 'next-intl';
import { ThemeProvider } from 'next-themes';
import { isRetryable } from '@/shared/api/errors';
import { useLocale } from '@/shared/i18n/locale';
import ru from '@/shared/i18n/messages/ru.json';
import uz from '@/shared/i18n/messages/uz.json';
import { TooltipProvider } from '@/shared/ui/kit/tooltip';
import { Toaster } from '@/shared/ui/kit/sonner';

const MESSAGES = { uz, ru } as const;

function makeQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 30_000,
				refetchOnWindowFocus: false,
				// Only network/timeout/5xx-edge errors are retried (cold start) — 2 extra attempts.
				retry: (count, err) => isRetryable(err) && count < 2,
				retryDelay: n => Math.min(3_000 * 2 ** n, 15_000),
			},
			mutations: { retry: false },
		},
	});
}

export function Providers({ children }: { children: React.ReactNode }) {
	const [queryClient] = useState(makeQueryClient);
	const locale = useLocale();

	// Responses are localised via Accept-Language — refetch everything when it changes.
	const prevLocale = useRef(locale);
	useEffect(() => {
		document.documentElement.lang = locale;
		if (prevLocale.current !== locale) {
			prevLocale.current = locale;
			void queryClient.invalidateQueries();
		}
	}, [locale, queryClient]);

	return (
		<QueryClientProvider client={queryClient}>
			<NextIntlClientProvider locale={locale} messages={MESSAGES[locale]} timeZone='Asia/Tashkent'>
				<ThemeProvider
					attribute='class'
					defaultTheme='system'
					enableSystem
					disableTransitionOnChange
				>
					<TooltipProvider>
						{children}
						<Toaster />
					</TooltipProvider>
				</ThemeProvider>
			</NextIntlClientProvider>
		</QueryClientProvider>
	);
}
