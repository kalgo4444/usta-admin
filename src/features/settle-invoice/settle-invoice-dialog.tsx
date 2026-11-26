'use client';

import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { financeApi, invoiceDebt } from '@/entities/finance';
import { invalidate } from '@/shared/api/invalidate';
import type { Invoice } from '@/shared/api/types';
import { useMutationErrorHandler } from '@/shared/api/use-mutation-error';
import { bindFieldErrors } from '@/shared/lib/form';
import { formatDate, formatMoney } from '@/shared/lib/format';
import { Button } from '@/shared/ui/kit/button';
import { Input } from '@/shared/ui/kit/input';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/shared/ui/kit/dialog';
import { Field } from '@/shared/ui/field';

/**
 * POST /admin/finance/settlements. The backend only accepts the invoice's `due`
 * (overpayment already deducted), so the amount is prefilled and locked to it.
 */
export function SettleInvoiceDialog({
	invoice,
	masterLabel,
	open,
	onOpenChange,
}: {
	invoice: Invoice | null;
	masterLabel: string;
	open: boolean;
	onOpenChange: (o: boolean) => void;
}) {
	const t = useTranslations('finance');
	const tc = useTranslations('common');
	const te = useTranslations('errors');
	const qc = useQueryClient();
	const onError = useMutationErrorHandler();
	const debt = invoice ? invoiceDebt(invoice) : 0;

	const schema = z.object({
		reference: z
			.string()
			.trim()
			.max(128, te('maxLength', { max: 128 })),
	});
	type Values = z.infer<typeof schema>;
	const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { reference: '' } });
	const reference = useWatch({ control: form.control, name: 'reference' });

	useEffect(() => {
		if (open) form.reset({ reference: '' });
	}, [open, form]);

	const submit = form.handleSubmit(async v => {
		if (!invoice?.masterId || !invoice.period) return;
		try {
			const res = await financeApi.settle({
				masterId: invoice.masterId,
				period: invoice.period,
				amount: debt,
				reference: v.reference || undefined,
			});
			toast.success(t('settledToast', { balance: formatMoney(res.balance) }));
			await invalidate(qc, ['admin', 'finance']);
			onOpenChange(false);
		} catch (e) {
			bindFieldErrors(onError(e), form.setError);
		}
	});

	return (
		<Dialog open={open} onOpenChange={o => !form.formState.isSubmitting && onOpenChange(o)}>
			<DialogContent className='max-w-md'>
				<DialogHeader>
					<DialogTitle>{t('settleTitle')}</DialogTitle>
					<DialogDescription>
						{masterLabel} · {t('period')}: {formatDate(invoice?.period, false)}
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={submit} className='space-y-4'>
					<Field label={t('amount')} hint={t('settleHint')}>
						<Input value={formatMoney(debt)} readOnly className='bg-muted num text-lg' />
					</Field>
					<Field
						label={t('reference')}
						htmlFor='ref'
						hint={tc('optional')}
						counter={{ value: reference, max: 128 }}
						error={form.formState.errors.reference?.message}
					>
						<Input id='ref' {...form.register('reference')} autoFocus />
					</Field>
					<DialogFooter>
						<Button type='button' variant='secondary' onClick={() => onOpenChange(false)}>
							{tc('cancel')}
						</Button>
						<Button type='submit' disabled={form.formState.isSubmitting || debt <= 0}>
							{form.formState.isSubmitting ? tc('loading') : t('settle')}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
