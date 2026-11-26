'use client';

import { useRef, useState } from 'react';
import { UploadIcon, XIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/shared/ui/kit/button';

export interface ImageRules {
	/** MIME types, e.g. image/png. */
	types: readonly string[];
	maxBytes: number;
	minPx: number;
	maxPx: number;
	square?: boolean;
}

const MB = 1024 * 1024;
const formatSize = (b: number) => (b >= MB ? `${b / MB} MB` : `${Math.round(b / 1024)} KB`);

async function readSize(file: File): Promise<{ w: number; h: number } | null> {
	try {
		const bmp = await createImageBitmap(file);
		const size = { w: bmp.width, h: bmp.height };
		bmp.close();
		return size;
	} catch {
		return null;
	}
}

/**
 * One image slot (catalog image / own icon): preview, upload with client-side checks of
 * type, size and pixel dimensions (the backend re-checks), and remove. `onUpload` /
 * `onRemove` report their own errors; this only shows validation messages.
 */
export function ImageUpload({
	label,
	preview,
	hasValue,
	rules,
	onUpload,
	onRemove,
}: {
	label: string;
	preview: React.ReactNode;
	hasValue: boolean;
	rules: ImageRules;
	onUpload: (file: File) => Promise<unknown>;
	onRemove: () => Promise<unknown>;
}) {
	const t = useTranslations('upload');
	const input = useRef<HTMLInputElement>(null);
	const [pending, setPending] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const types = rules.types.map(x => x.replace('image/', '').toUpperCase()).join(', ');
	const hint = t('rules', {
		types,
		max: formatSize(rules.maxBytes),
		min: rules.minPx,
		maxPx: rules.maxPx,
	});

	const validate = async (file: File) => {
		if (!rules.types.includes(file.type)) return t('invalidType', { types });
		if (file.size > rules.maxBytes) return t('tooLarge', { max: formatSize(rules.maxBytes) });
		const size = await readSize(file);
		if (!size) return t('unreadable');
		const { w, h } = size;
		if (Math.min(w, h) < rules.minPx || Math.max(w, h) > rules.maxPx)
			return t('dimensions', { min: rules.minPx, max: rules.maxPx });
		if (rules.square && w !== h) return t('notSquare');
		return null;
	};

	const run = async (fn: () => Promise<unknown>) => {
		setPending(true);
		try {
			await fn();
		} catch {
			// reported by the caller
		} finally {
			setPending(false);
		}
	};

	const pick = async (file: File | undefined) => {
		if (input.current) input.current.value = '';
		if (!file) return;
		const problem = await validate(file);
		setError(problem);
		if (!problem) await run(() => onUpload(file));
	};

	return (
		<div className='flex items-start gap-4'>
			<div className='flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted'>
				{preview}
			</div>
			<div className='min-w-0 flex-1 space-y-1.5'>
				<p className='text-sm font-medium'>{label}</p>
				<div className='flex flex-wrap gap-2'>
					<Button
						type='button'
						variant='secondary'
						size='xs'
						disabled={pending}
						onClick={() => input.current?.click()}
					>
						<UploadIcon /> {pending ? t('uploading') : hasValue ? t('replace') : t('upload')}
					</Button>
					{hasValue && (
						<Button
							type='button'
							variant='ghost'
							size='xs'
							className='text-destructive'
							disabled={pending}
							onClick={() => run(onRemove)}
						>
							<XIcon /> {t('remove')}
						</Button>
					)}
				</div>
				<p className='text-xs text-muted-foreground'>{hint}</p>
				{error && <p className='text-xs text-destructive'>{error}</p>}
				<input
					ref={input}
					type='file'
					accept={rules.types.join(',')}
					className='hidden'
					onChange={e => void pick(e.target.files?.[0])}
				/>
			</div>
		</div>
	);
}
