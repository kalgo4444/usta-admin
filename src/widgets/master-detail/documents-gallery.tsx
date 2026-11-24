'use client';

import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, FileTextIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { DocumentType, MasterDocument } from '@/shared/api/types';
import { useEnumLabel } from '@/shared/i18n/use-enum';
import { formatBytes, formatDate } from '@/shared/lib/format';
import { Button } from '@/shared/ui/kit/button';
import { Dialog, DialogContent, DialogTitle } from '@/shared/ui/kit/dialog';
import { ExternalLink } from '@/shared/ui/external-link';

const ORDER: DocumentType[] = ['PASSPORT', 'SELFIE', 'CERTIFICATE', 'OTHER'];
const isImage = (d: { contentType?: string }) => d.contentType?.startsWith('image/');

/** Grouped by type; images open in a lightbox, PDFs and other files in a new tab. */
export function DocumentsGallery({ documents }: { documents: MasterDocument[] }) {
	const t = useTranslations('masters');
	const label = useEnumLabel();
	const images = documents.filter(isImage);
	const [index, setIndex] = useState<number | null>(null);
	const current = index !== null ? images[index] : null;

	if (documents.length === 0)
		return <p className='text-sm text-muted-foreground'>{t('noDocuments')}</p>;

	return (
		<div className='space-y-6'>
			{ORDER.map(type => {
				const docs = documents.filter(d => d.type === type);
				if (!docs.length) return null;
				return (
					<section key={type} className='space-y-3'>
						<h4 className='text-sm font-semibold'>
							{label('DocumentType', type)}{' '}
							<span className='text-muted-foreground'>· {docs.length}</span>
						</h4>
						<div className='grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4'>
							{docs.map(d =>
								isImage(d) ? (
									<button
										key={d.id}
										type='button'
										onClick={() => setIndex(images.indexOf(d))}
										className='group relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted'
									>
										{/* eslint-disable-next-line @next/next/no-img-element -- presigned, expiring URL */}
										<img
											src={d.url}
											alt={label('DocumentType', d.type)}
											className='size-full object-cover transition-transform group-hover:scale-[1.02]'
										/>
									</button>
								) : (
									<ExternalLink
										key={d.id}
										href={d.url}
										className='flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-lg border border-border bg-muted p-3 text-center text-sm hover:bg-secondary'
									>
										<FileTextIcon className='size-7 text-muted-foreground' />
										<span className='font-medium'>{t('openPdf')}</span>
										<span className='num text-xs text-muted-foreground'>
											{formatBytes(d.sizeBytes)}
										</span>
									</ExternalLink>
								),
							)}
						</div>
					</section>
				);
			})}

			<Dialog open={current !== null} onOpenChange={o => !o && setIndex(null)}>
				<DialogContent className='max-w-4xl gap-3 p-3'>
					{current && (
						<>
							<DialogTitle className='px-2 pt-1 text-sm'>
								{label('DocumentType', current.type)}{' '}
								<span className='num font-normal text-muted-foreground'>
									· {formatDate(current.createdAt)}
								</span>
							</DialogTitle>
							<div className='relative flex items-center justify-center rounded-lg bg-black'>
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img src={current.url} alt='' className='max-h-[75vh] w-auto object-contain' />
								{images.length > 1 && (
									<>
										<Button
											variant='secondary'
											size='icon'
											className='absolute left-3'
											onClick={() => setIndex(i => ((i ?? 0) - 1 + images.length) % images.length)}
										>
											<ChevronLeftIcon />
										</Button>
										<Button
											variant='secondary'
											size='icon'
											className='absolute right-3'
											onClick={() => setIndex(i => ((i ?? 0) + 1) % images.length)}
										>
											<ChevronRightIcon />
										</Button>
									</>
								)}
							</div>
						</>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
