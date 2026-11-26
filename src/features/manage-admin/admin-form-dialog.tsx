'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { CheckIcon, InfoIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { adminApi, adminKeys, usePermissionOptions } from '@/entities/admin';
import { invalidate } from '@/shared/api/invalidate';
import { ENUMS, type AdminAccount, type AdminPermission } from '@/shared/api/types';
import { useMutationErrorHandler } from '@/shared/api/use-mutation-error';
import { useEnumLabel } from '@/shared/i18n/use-enum';
import { bindFieldErrors } from '@/shared/lib/form';
import { formatPhone } from '@/shared/lib/format';
import { cn } from '@/shared/lib/utils';
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

/** "90 123-45-67" / "998901234567" → "+998901234567" (backend format). */
export function normalizePhone(raw: string) {
	const digits = raw.replace(/\D/g, '');
	if (digits.length === 9) return `+998${digits}`;
	return `+${digits}`;
}

interface Props {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	/** Edit permissions of this admin; appoint a new one when absent. */
	admin?: AdminAccount;
}

export function AdminFormDialog(props: Props) {
	const t = useTranslations('admins');
	const [busy, setBusy] = useState(false);
	return (
		<Dialog open={props.open} onOpenChange={o => !busy && props.onOpenChange(o)}>
			<DialogContent className='max-w-lg'>
				<DialogHeader>
					<DialogTitle>{props.admin ? t('editTitle') : t('appointTitle')}</DialogTitle>
					<DialogDescription>
						{props.admin ? formatPhone(props.admin.phone) : t('appointDescription')}
					</DialogDescription>
				</DialogHeader>
				{/* mounted per open → fresh defaults */}
				{props.open && <AdminForm {...props} onBusy={setBusy} />}
			</DialogContent>
		</Dialog>
	);
}

function AdminForm({ onOpenChange, admin, onBusy }: Props & { onBusy: (b: boolean) => void }) {
	const t = useTranslations('admins');
	const tc = useTranslations('common');
	const te = useTranslations('errors');
	const label = useEnumLabel();
	const qc = useQueryClient();
	const onError = useMutationErrorHandler();
	const options = usePermissionOptions();
	const names = new Map((options.data ?? []).map(o => [o.code, o.name]));

	const schema = z.object({
		phone: admin
			? z.string()
			: z
					.string()
					.trim()
					.min(1, te('required'))
					.refine(v => /^\+998\d{9}$/.test(normalizePhone(v)), t('invalidPhone')),
		permissions: z.array(z.enum(ENUMS.adminPermission)).min(1, t('permissionsRequired')),
	});
	type Values = z.infer<typeof schema>;

	const form = useForm<Values>({
		resolver: zodResolver(schema),
		defaultValues: { phone: '', permissions: admin?.permissions ?? [] },
	});
	const err = form.formState.errors;

	const submit = form.handleSubmit(async v => {
		onBusy(true);
		try {
			if (admin?.id) {
				await adminApi.setPermissions(admin.id, v.permissions);
				toast.success(t('savedToast'));
			} else {
				await adminApi.appoint({ phone: normalizePhone(v.phone), permissions: v.permissions });
				toast.success(t('appointedToast'));
			}
			await invalidate(qc, adminKeys.list, ['admin', 'users']);
			onOpenChange(false);
		} catch (e) {
			bindFieldErrors(onError(e), form.setError);
		} finally {
			onBusy(false);
		}
	});

	return (
		<form onSubmit={submit} className='space-y-5'>
			{!admin && (
				<Field label={t('phone')} htmlFor='a-phone' required error={err.phone?.message}>
					<Input
						id='a-phone'
						type='tel'
						inputMode='tel'
						autoFocus
						placeholder='+998 90 123 45 67'
						className='num'
						{...form.register('phone')}
					/>
				</Field>
			)}
			<Field label={t('permissions')} required error={err.permissions?.message}>
				<Controller
					control={form.control}
					name='permissions'
					render={({ field }) => (
						<div className='flex flex-wrap gap-2' role='group' aria-label={t('permissions')}>
							{ENUMS.adminPermission.map(p => {
								const on = field.value.includes(p);
								const toggle = () =>
									field.onChange(
										on ? field.value.filter(x => x !== p) : [...field.value, p as AdminPermission],
									);
								return (
									<button
										key={p}
										type='button'
										aria-pressed={on}
										onClick={toggle}
										className={cn(
											'inline-flex h-9 items-center gap-1.5 rounded-pill border px-3.5 text-sm transition-colors',
											on
												? 'border-primary bg-primary/10 text-primary'
												: 'border-border text-muted-foreground hover:bg-secondary',
											p === 'DELETE' &&
												on &&
												'border-destructive bg-destructive/10 text-destructive',
										)}
									>
										{on && <CheckIcon className='size-3.5' />}
										{names.get(p) ?? label('AdminPermission', p)}
									</button>
								);
							})}
						</div>
					)}
				/>
			</Field>
			{admin && (
				<p className='flex gap-2 rounded-md bg-muted p-3 text-sm text-muted-foreground'>
					<InfoIcon className='mt-0.5 size-4 shrink-0' />
					{t('tokenNote')}
				</p>
			)}
			<DialogFooter>
				<Button type='button' variant='secondary' onClick={() => onOpenChange(false)}>
					{tc('cancel')}
				</Button>
				<Button type='submit' disabled={form.formState.isSubmitting}>
					{form.formState.isSubmitting ? tc('loading') : admin ? tc('save') : t('appoint')}
				</Button>
			</DialogFooter>
		</form>
	);
}
