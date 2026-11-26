'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { HandIcon, LockIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { complaintApi } from '@/entities/complaint/api';
import { invalidate } from '@/shared/api/invalidate';
import type { AdminComplaint } from '@/shared/api/types';
import { useMutationErrorHandler } from '@/shared/api/use-mutation-error';
import { bindFieldErrors, toOptionalNumber } from '@/shared/lib/form';
import { Button } from '@/shared/ui/kit/button';
import { Input } from '@/shared/ui/kit/input';
import { Textarea } from '@/shared/ui/kit/textarea';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/shared/ui/kit/dialog';
import { ChoiceGroup } from '@/shared/ui/choice-group';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { Field } from '@/shared/ui/field';

const NONE = 'NONE';

/** OPEN → take → IN_REVIEW → close (RESOLVED | REJECTED). */
export function ComplaintActions({
	data,
	orderHasPrice,
}: {
	data: AdminComplaint;
	orderHasPrice: boolean;
}) {
	const t = useTranslations('complaints');
	const tc = useTranslations('common');
	const te = useTranslations('errors');
	const to = useTranslations('orders');
	const tEnum = useTranslations('enums.ComplaintStatus');
	const qc = useQueryClient();
	const onError = useMutationErrorHandler();
	const [open, setOpen] = useState<'take' | 'close' | null>(null);

	const c = data.complaint!;
	const id = c.id!;
	const isDisputed = data.orderStatus === 'DISPUTED';

	const schema = z
		.object({
			result: z.enum(['RESOLVED', 'REJECTED'], { error: te('required') }),
			note: z
				.string()
				.trim()
				.min(1, te('required'))
				.max(2000, te('maxLength', { max: 2000 })),
			orderResolution: z.enum(['COMPLETED', 'CANCELLED', NONE]),
			price: z
				.number({ error: te('invalidNumber') })
				.min(1, te('minValue', { min: 1 }))
				.optional(),
		})
		.refine(v => v.orderResolution !== 'COMPLETED' || orderHasPrice || v.price !== undefined, {
			path: ['price'],
			message: to('priceRequired'),
		});
	type Values = z.infer<typeof schema>;

	const form = useForm<Values>({
		resolver: zodResolver(schema),
		defaultValues: { result: undefined, note: '', orderResolution: NONE, price: undefined },
	});
	const orderResolution = useWatch({ control: form.control, name: 'orderResolution' });
	const note = useWatch({ control: form.control, name: 'note' });

	const done = () =>
		invalidate(
			qc,
			['admin', 'complaints'],
			['admin', 'complaint', id],
			['admin', 'orders'],
			['admin', 'order'],
		);

	const submit = form.handleSubmit(async v => {
		try {
			const withOrder = isDisputed && v.orderResolution !== NONE;
			await complaintApi.close(id, {
				result: v.result,
				note: v.note,
				orderResolution: withOrder ? (v.orderResolution as 'COMPLETED' | 'CANCELLED') : undefined,
				price: withOrder && v.orderResolution === 'COMPLETED' ? v.price : undefined,
			});
			toast.success(t('closedToast'));
			await done();
			setOpen(null);
			form.reset();
		} catch (e) {
			bindFieldErrors(onError(e), form.setError);
		}
	});

	return (
		<>
			{c.status === 'OPEN' && (
				<Button onClick={() => setOpen('take')}>
					<HandIcon /> {t('take')}
				</Button>
			)}
			{c.status === 'IN_REVIEW' && (
				<Button onClick={() => setOpen('close')}>
					<LockIcon /> {t('close')}
				</Button>
			)}

			<ConfirmDialog
				open={open === 'take'}
				onOpenChange={o => setOpen(o ? 'take' : null)}
				title={t('take')}
				onConfirm={() =>
					complaintApi.take(id).then(
						() => {
							toast.success(t('takenToast'));
							return done();
						},
						e => {
							onError(e);
							throw e;
						},
					)
				}
			/>

			<Dialog
				open={open === 'close'}
				onOpenChange={o => !form.formState.isSubmitting && setOpen(o ? 'close' : null)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t('closeTitle')}</DialogTitle>
						{isDisputed && <DialogDescription>{t('orderResolutionHint')}</DialogDescription>}
					</DialogHeader>
					<form onSubmit={submit} className='space-y-5'>
						<Field label={t('result')} required error={form.formState.errors.result?.message}>
							<Controller
								control={form.control}
								name='result'
								render={({ field }) => (
									<ChoiceGroup
										name='result'
										value={field.value}
										onChange={field.onChange}
										options={[
											{ value: 'RESOLVED', label: tEnum('RESOLVED') },
											{ value: 'REJECTED', label: tEnum('REJECTED'), tone: 'danger' },
										]}
									/>
								)}
							/>
						</Field>
						{isDisputed && (
							<Field label={t('orderResolution')}>
								<Controller
									control={form.control}
									name='orderResolution'
									render={({ field }) => (
										<ChoiceGroup
											name='orderResolution'
											value={field.value}
											onChange={field.onChange}
											options={[
												{ value: NONE, label: t('noOrderResolution') },
												{ value: 'COMPLETED', label: to('resolutionCompleted') },
												{ value: 'CANCELLED', label: to('resolutionCancelled'), tone: 'danger' },
											]}
										/>
									)}
								/>
							</Field>
						)}
						{isDisputed && orderResolution === 'COMPLETED' && (
							<>
								<p className='rounded-md bg-warning/10 p-3 text-sm text-warning'>
									{to('commissionWarning')}
								</p>
								<Field
									label={to('price')}
									htmlFor='c-price'
									required={!orderHasPrice}
									error={form.formState.errors.price?.message}
								>
									<Input
										id='c-price'
										type='number'
										min={1}
										step='any'
										className='num'
										{...form.register('price', { setValueAs: toOptionalNumber })}
									/>
								</Field>
							</>
						)}
						<Field
							label={tc('note')}
							htmlFor='c-note'
							required
							counter={{ value: note, max: 2000 }}
							error={form.formState.errors.note?.message}
						>
							<Textarea id='c-note' rows={4} {...form.register('note')} />
						</Field>
						<DialogFooter>
							<Button type='button' variant='secondary' onClick={() => setOpen(null)}>
								{tc('cancel')}
							</Button>
							<Button type='submit' disabled={form.formState.isSubmitting}>
								{form.formState.isSubmitting ? tc('loading') : tc('confirm')}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</>
	);
}
