'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { GavelIcon, TriangleAlertIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { orderApi } from '@/entities/order/api';
import { invalidate } from '@/shared/api/invalidate';
import type { Order } from '@/shared/api/types';
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
import { Field } from '@/shared/ui/field';

const MAX_PRICE = 999_999_999_999.99;

export function ResolveDisputeDialog({ order }: { order: Order }) {
	const t = useTranslations('orders');
	const tc = useTranslations('common');
	const te = useTranslations('errors');
	const qc = useQueryClient();
	const onError = useMutationErrorHandler();
	const [open, setOpen] = useState(false);
	const hasPrice = order.price !== undefined && order.price !== null;

	const schema = z
		.object({
			resolution: z.enum(['COMPLETED', 'CANCELLED'], { error: te('required') }),
			note: z
				.string()
				.trim()
				.min(1, te('required'))
				.max(500, te('maxLength', { max: 500 })),
			price: z
				.number({ error: te('invalidNumber') })
				.min(1, te('minValue', { min: 1 }))
				.max(MAX_PRICE)
				.optional(),
		})
		.refine(v => v.resolution !== 'COMPLETED' || hasPrice || v.price !== undefined, {
			path: ['price'],
			message: t('priceRequired'),
		});
	type Values = z.infer<typeof schema>;

	const form = useForm<Values>({
		resolver: zodResolver(schema),
		defaultValues: { resolution: undefined, note: '', price: undefined },
	});
	const resolution = useWatch({ control: form.control, name: 'resolution' });
	const note = useWatch({ control: form.control, name: 'note' });

	const submit = form.handleSubmit(async v => {
		try {
			await orderApi.resolve(order.id!, {
				resolution: v.resolution,
				note: v.note,
				price: v.resolution === 'COMPLETED' ? v.price : undefined,
			});
			toast.success(t('resolvedToast'));
			await invalidate(
				qc,
				['admin', 'orders'],
				['admin', 'order', order.id!],
				['admin', 'complaints'],
				['admin', 'finance'],
			);
			setOpen(false);
			form.reset();
		} catch (e) {
			bindFieldErrors(onError(e), form.setError);
		}
	});

	return (
		<>
			<Button variant='destructive' onClick={() => setOpen(true)}>
				<GavelIcon /> {t('resolve')}
			</Button>
			<Dialog open={open} onOpenChange={o => !form.formState.isSubmitting && setOpen(o)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t('resolveTitle')}</DialogTitle>
						<DialogDescription>{order.serviceName}</DialogDescription>
					</DialogHeader>
					<form onSubmit={submit} className='space-y-5'>
						<Field
							label={t('resolution')}
							required
							error={form.formState.errors.resolution?.message}
						>
							<Controller
								control={form.control}
								name='resolution'
								render={({ field }) => (
									<ChoiceGroup
										name='resolution'
										value={field.value}
										onChange={field.onChange}
										options={[
											{ value: 'COMPLETED', label: t('resolutionCompleted') },
											{ value: 'CANCELLED', label: t('resolutionCancelled'), tone: 'danger' },
										]}
									/>
								)}
							/>
						</Field>
						{resolution === 'COMPLETED' && (
							<>
								<p className='flex gap-2 rounded-md bg-warning/10 p-3 text-sm text-warning'>
									<TriangleAlertIcon className='mt-0.5 size-4 shrink-0' />
									{t('commissionWarning')}
								</p>
								<Field
									label={t('price')}
									htmlFor='price'
									required={!hasPrice}
									hint={hasPrice ? tc('optional') : undefined}
									error={form.formState.errors.price?.message}
								>
									<Input
										id='price'
										type='number'
										inputMode='decimal'
										min={1}
										step='any'
										className='num'
										placeholder={hasPrice ? String(order.price) : undefined}
										{...form.register('price', { setValueAs: toOptionalNumber })}
									/>
								</Field>
							</>
						)}
						<Field
							label={tc('note')}
							htmlFor='note'
							required
							counter={{ value: note, max: 500 }}
							error={form.formState.errors.note?.message}
						>
							<Textarea id='note' rows={3} {...form.register('note')} />
						</Field>
						<DialogFooter>
							<Button type='button' variant='secondary' onClick={() => setOpen(false)}>
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
