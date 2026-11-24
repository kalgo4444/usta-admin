'use client';

import { FileIcon, PlayIcon } from 'lucide-react';
import type { Attachment } from '@/shared/api/types';
import { formatBytes } from '@/shared/lib/format';

export function Attachments({ items }: { items: Attachment[] }) {
	return (
		<div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
			{items.map(a => {
				const type = a.mediaType ?? '';
				const image = type.startsWith('image') || type === 'PHOTO' || type === 'IMAGE';
				const video = type.startsWith('video') || type === 'VIDEO';
				return (
					<a
						key={a.id}
						href={a.url}
						target='_blank'
						rel='noopener noreferrer'
						className='group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted'
					>
						{image ? (
							// eslint-disable-next-line @next/next/no-img-element -- presigned URL
							<img src={a.url} alt='' className='size-full object-cover' />
						) : video ? (
							<>
								<video src={a.url} preload='metadata' muted className='size-full object-cover' />
								<span className='absolute inset-0 flex items-center justify-center'>
									<span className='flex size-10 items-center justify-center rounded-full bg-black/60 text-white'>
										<PlayIcon className='size-4 fill-current' />
									</span>
								</span>
							</>
						) : (
							<span className='flex size-full flex-col items-center justify-center gap-1 text-xs text-muted-foreground'>
								<FileIcon className='size-6' />
								{formatBytes(a.sizeBytes)}
							</span>
						)}
					</a>
				);
			})}
		</div>
	);
}
