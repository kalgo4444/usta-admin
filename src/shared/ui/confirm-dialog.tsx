'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/shared/ui/kit/button';
import { Input } from '@/shared/ui/kit/input';
import { Label } from '@/shared/ui/kit/label';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/shared/ui/kit/dialog';

interface ConfirmDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: React.ReactNode;
	description?: React.ReactNode;
	confirmLabel?: string;
	destructive?: boolean;
	/** Second confirmation step: the user must type this word (e.g. reindex). */
	typeToConfirm?: string;
	children?: React.ReactNode;
	onConfirm: () => Promise<unknown> | void;
}

/** For irreversible actions. Stays open while `onConfirm` is pending; closes on success. */
export function ConfirmDialog({
	open,
	onOpenChange,
	title,
	description,
	confirmLabel,
	destructive,
	typeToConfirm,
	children,
	onConfirm,
}: ConfirmDialogProps) {
	const t = useTranslations('common');
	const [pending, setPending] = useState(false);
	const [typed, setTyped] = useState('');
	const locked = Boolean(typeToConfirm) && typed.trim() !== typeToConfirm;

	const change = (o: boolean) => {
		if (pending) return;
		if (!o) setTyped('');
		onOpenChange(o);
	};

	const run = async () => {
		setPending(true);
		try {
			await onConfirm();
			setTyped('');
			onOpenChange(false);
		} catch {
			// the caller reports the error; keep the dialog open
		} finally {
			setPending(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={change}>
			<DialogContent className='max-w-md'>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					{description && <DialogDescription>{description}</DialogDescription>}
				</DialogHeader>
				{children}
				{typeToConfirm && (
					<div className='space-y-2'>
						<Label htmlFor='type-to-confirm'>{t('typeToConfirm', { word: typeToConfirm })}</Label>
						<Input
							id='type-to-confirm'
							value={typed}
							onChange={e => setTyped(e.target.value)}
							autoComplete='off'
						/>
					</div>
				)}
				<DialogFooter>
					<Button variant='secondary' onClick={() => change(false)} disabled={pending}>
						{t('cancel')}
					</Button>
					<Button
						variant={destructive ? 'destructive' : 'default'}
						onClick={run}
						disabled={pending || locked}
					>
						{pending ? t('loading') : (confirmLabel ?? t('confirm'))}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
