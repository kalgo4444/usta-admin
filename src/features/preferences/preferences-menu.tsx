'use client';

import { LanguagesIcon, MonitorIcon, MoonIcon, SunIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { LOCALES, localeStore, useLocale, type Locale } from '@/shared/i18n/locale';
import { Button } from '@/shared/ui/kit/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/shared/ui/kit/dropdown-menu';

const LOCALE_NAMES: Record<Locale, string> = { uz: "O'zbekcha", ru: 'Русский' };

export function PreferencesMenu() {
	const t = useTranslations('common');
	const locale = useLocale();
	const { theme, setTheme, resolvedTheme } = useTheme();
	const Icon = resolvedTheme === 'dark' ? MoonIcon : SunIcon;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant='ghost' size='sm' className='gap-1.5'>
					<LanguagesIcon />
					<span className='uppercase'>{locale}</span>
					<Icon className='ml-1' />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align='end'>
				<DropdownMenuLabel>{t('language')}</DropdownMenuLabel>
				<DropdownMenuRadioGroup value={locale} onValueChange={v => localeStore.set(v as Locale)}>
					{LOCALES.map(l => (
						<DropdownMenuRadioItem key={l} value={l}>
							{LOCALE_NAMES[l]}
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
				<DropdownMenuSeparator />
				<DropdownMenuLabel>{t('theme')}</DropdownMenuLabel>
				<DropdownMenuRadioGroup value={theme ?? 'system'} onValueChange={setTheme}>
					<DropdownMenuRadioItem value='light'>
						<SunIcon /> {t('light')}
					</DropdownMenuRadioItem>
					<DropdownMenuRadioItem value='dark'>
						<MoonIcon /> {t('dark')}
					</DropdownMenuRadioItem>
					<DropdownMenuRadioItem value='system'>
						<MonitorIcon /> {t('system')}
					</DropdownMenuRadioItem>
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
