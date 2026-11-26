'use client';

import { useState } from 'react';
import { PencilIcon, PlusIcon, ShieldCheckIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { useAdmins, usePermissionOptions } from '@/entities/admin';
import { RemoveAdminButton } from '@/features/manage-admin';
import type { AdminAccount } from '@/shared/api/types';
import { useEnumLabel } from '@/shared/i18n/use-enum';
import { formatDate } from '@/shared/lib/format';
import { useOpenedOnce } from '@/shared/lib/use-opened-once';
import { Badge } from '@/shared/ui/kit/badge';
import { Button } from '@/shared/ui/kit/button';
import { columnHelper, DataTable } from '@/shared/ui/data-table';
import { PageHeader } from '@/shared/ui/page-header';
import { PhoneText } from '@/shared/ui/phone-text';
import { StatusBadge } from '@/shared/ui/status-badge';

/** Loaded on first open: keeps zod + react-hook-form out of the page's initial JS. */
const AdminFormDialog = dynamic(() =>
	import('@/features/manage-admin').then(m => m.AdminFormDialog),
);

const col = columnHelper<AdminAccount>();

/** Super admin only (route guarded in AdminShell via nav access). */
export function AdminsPage() {
	const t = useTranslations('admins');
	const tc = useTranslations('common');
	const label = useEnumLabel();
	const q = useAdmins();
	const options = usePermissionOptions();
	const names = new Map((options.data ?? []).map(o => [o.code, o.name]));
	const [dialog, setDialog] = useState<{ admin?: AdminAccount } | null>(null);
	const dialogMounted = useOpenedOnce(dialog !== null);

	const columns = [
		col.accessor('phone', {
			header: t('phone'),
			cell: ({ row, getValue }) => (
				<span className='flex items-center gap-2'>
					<PhoneText phone={getValue()} className='font-medium' />
					{row.original.superAdmin && (
						<Badge tone='amber'>
							<ShieldCheckIcon /> {t('superAdmin')}
						</Badge>
					)}
				</span>
			),
		}),
		col.accessor('permissions', {
			header: t('permissions'),
			cell: ({ row, getValue }) =>
				row.original.superAdmin ? (
					<span className='text-sm text-muted-foreground'>{t('allPermissions')}</span>
				) : (
					<div className='flex max-w-md flex-wrap gap-1'>
						{(getValue() ?? []).map(p => (
							<Badge key={p} tone={p === 'DELETE' ? 'red' : 'neutral'}>
								{names.get(p) ?? label('AdminPermission', p)}
							</Badge>
						))}
					</div>
				),
		}),
		col.accessor('status', {
			header: t('status'),
			cell: c => <StatusBadge kind='UserStatus' value={c.getValue()} />,
		}),
		col.accessor('lastLoginAt', {
			header: t('lastLogin'),
			cell: c => <span className='num text-muted-foreground'>{formatDate(c.getValue())}</span>,
		}),
		col.accessor('createdAt', {
			header: t('createdAt'),
			cell: c => <span className='num text-muted-foreground'>{formatDate(c.getValue())}</span>,
		}),
		col.display({
			id: 'actions',
			header: '',
			meta: { className: 'text-right' },
			cell: ({ row }) =>
				row.original.superAdmin ? null : (
					<span className='inline-flex gap-1'>
						<Button
							variant='ghost'
							size='icon-sm'
							aria-label={tc('edit')}
							title={tc('edit')}
							onClick={() => setDialog({ admin: row.original })}
						>
							<PencilIcon />
						</Button>
						<RemoveAdminButton admin={row.original} />
					</span>
				),
		}),
	];

	return (
		<div className='space-y-6'>
			<PageHeader
				title={t('title')}
				description={t('subtitle')}
				actions={
					<Button onClick={() => setDialog({})}>
						<PlusIcon /> {t('appoint')}
					</Button>
				}
			/>
			<DataTable
				columns={columns}
				data={q.data}
				isLoading={q.isFetching}
				error={q.error}
				onRetry={() => q.refetch()}
				getRowId={r => r.id!}
			/>
			{dialogMounted && (
				<AdminFormDialog
					open={dialog !== null}
					onOpenChange={o => !o && setDialog(null)}
					admin={dialog?.admin}
				/>
			)}
		</div>
	);
}
