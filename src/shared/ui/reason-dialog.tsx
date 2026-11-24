'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/shared/ui/kit/button';
import { Label } from '@/shared/ui/kit/label';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/shared/ui/kit/dialog';
import { CharCounter } from './field';
import { Textarea } from '@/shared/ui/kit/textarea';

interface ReasonDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: React.ReactNode;
	description?: React.ReactNode;
	label?: string;
	max: number;
	presets?: string[];
	confirmLabel?: string;
	destructive?: boolean;
	onSubmit: (reason: string) => Promise<unknown>;
}

/** Block / reject / resolve — free-text reason with a live character counter. */
export function ReasonDialog({
	open,
	onOpenChange,
	title,
	description,
	label,
	max,
	presets,
	confirmLabel,
	destructive = true,
	onSubmit,
}: ReasonDialogProps) {
	const t = useTranslations('common');
	const [reason, setReason] = useState('');
	const [pending, setPending] = useState(false);
	const trimmed = reason.trim();
	const invalid = !trimmed || reason.length > max;

	const change = (o: boolean) => {
		if (pending) return;
		if (!o) setReason('');
		onOpenChange(o);
	};

	const submit = async () => {
		if (invalid) return;
		setPending(true);
		try {
			await onSubmit(trimmed);
			setReason('');
			onOpenChange(false);
		} catch {
			// reported by caller
		} finally {
			setPending(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={change}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					{description && <DialogDescription>{description}</DialogDescription>}
				</DialogHeader>
				{presets && presets.length > 0 && (
					<div className='flex flex-wrap gap-2'>
						{presets.map(p => (
							<button
								key={p}
								type='button'
								onClick={() => setReason(r => (r.trim() ? `${r.trim()}. ${p}` : p).slice(0, max))}
								className='rounded-pill bg-secondary px-3 py-1.5 text-xs font-medium hover:bg-border'
							>
								{p}
							</button>
						))}
					</div>
				)}
				<div className='space-y-2'>
					<div className='flex items-baseline justify-between'>
						<Label htmlFor='reason'>{label ?? t('reason')}</Label>
						<CharCounter value={reason} max={max} />
					</div>
					<Textarea
						id='reason'
						value={reason}
						onChange={e => setReason(e.target.value)}
						aria-invalid={reason.length > max}
						rows={4}
						autoFocus
					/>
				</div>
				<DialogFooter>
					<Button variant='secondary' onClick={() => change(false)} disabled={pending}>
						{t('cancel')}
					</Button>
					<Button
						variant={destructive ? 'destructive' : 'default'}
						onClick={submit}
						disabled={pending || invalid}
					>
						{pending ? t('loading') : (confirmLabel ?? t('confirm'))}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
