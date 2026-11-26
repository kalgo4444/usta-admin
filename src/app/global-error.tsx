'use client';

import './globals.css';

/**
 * Replaces the root layout when it (or Providers) crashes, so i18n/theme providers are not
 * available here: the text is static and bilingual.
 */
export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<html lang='uz'>
			<body className='flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center'>
				<p className='font-semibold'>Xatolik yuz berdi · Произошла ошибка</p>
				{error.digest && <p className='num text-xs text-muted-foreground'>{error.digest}</p>}
				<button
					type='button'
					onClick={reset}
					className='rounded-full bg-secondary px-4 py-2 text-sm font-medium'
				>
					Qayta urinish · Повторить
				</button>
			</body>
		</html>
	);
}
