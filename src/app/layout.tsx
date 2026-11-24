import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-inter' });
const mono = JetBrains_Mono({
	subsets: ['latin', 'cyrillic'],
	variable: '--font-jetbrains',
	weight: ['400', '500'],
});

export const metadata: Metadata = {
	title: { default: 'Usta Admin', template: '%s · Usta Admin' },
	robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
	return (
		<html
			lang='uz'
			suppressHydrationWarning
			className={`${inter.variable} ${mono.variable} h-full antialiased`}
		>
			<body className='min-h-full'>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
