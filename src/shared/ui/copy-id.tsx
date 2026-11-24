'use client';

import { useState } from 'react';
import { CheckIcon, CopyIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { shortId } from '@/shared/lib/format';
import { cn } from '@/shared/lib/utils';
import { Tooltip } from '@/shared/ui/kit/tooltip';

export function CopyId({ id, className }: { id: string | null | undefined; className?: string }) {
	const t = useTranslations('common');
	const [copied, setCopied] = useState(false);
	if (!id) return <span className='text-subtle-foreground'>—</span>;
	return (
		<Tooltip content={copied ? t('copied') : id}>
			<button
				type='button'
				onClick={e => {
					e.stopPropagation();
					void navigator.clipboard.writeText(id).then(() => {
						setCopied(true);
						setTimeout(() => setCopied(false), 1200);
					});
				}}
				className={cn(
					'inline-flex items-center gap-1 rounded-xs px-1 num text-xs text-muted-foreground hover:bg-secondary hover:text-foreground',
					className,
				)}
			>
				{shortId(id)}
				{copied ? (
					<CheckIcon className='size-3 text-success' />
				) : (
					<CopyIcon className='size-3 opacity-60' />
				)}
			</button>
		</Tooltip>
	);
}
