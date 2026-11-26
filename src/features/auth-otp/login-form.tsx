'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeftIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { http } from '@/shared/api/client';
import { problemToApiError, toApiError } from '@/shared/api/errors';
import { sessionStore, type SessionPayload } from '@/shared/api/session';
import type { OtpChallengeResponse } from '@/shared/api/types';
import { routes } from '@/shared/config/routes';
import { localeStore } from '@/shared/i18n/locale';
import { formatPhone } from '@/shared/lib/format';
import { safeNextPath } from '@/shared/lib/url';
import { Button } from '@/shared/ui/kit/button';
import { Input } from '@/shared/ui/kit/input';
import { Field } from '@/shared/ui/field';

const DIAL = '998';
const PHONE_LENGTH = 9;

type Step =
	| { kind: 'phone' }
	| { kind: 'code'; phone: string; challenge: OtpChallengeResponse; sentAt: number };

function useCountdown(until: number | null) {
	const [now, setNow] = useState(() => Date.now());
	useEffect(() => {
		if (!until) return;
		const t = setInterval(() => setNow(Date.now()), 500);
		return () => clearInterval(t);
	}, [until]);
	return until ? Math.max(0, Math.ceil((until - now) / 1000)) : 0;
}

export function LoginForm() {
	const t = useTranslations('auth');
	const te = useTranslations('errors');
	const router = useRouter();
	const sp = useSearchParams();

	const [step, setStep] = useState<Step>({ kind: 'phone' });
	const [phone, setPhone] = useState('');
	const [code, setCode] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);
	const codeRef = useRef<HTMLInputElement>(null);

	const resendAt =
		step.kind === 'code' ? step.sentAt + (step.challenge.resendAfterSeconds ?? 60) * 1000 : null;
	const resendIn = useCountdown(resendAt);
	const codeLength = step.kind === 'code' ? (step.challenge.codeLength ?? 6) : 6;

	const describe = (e: unknown) => {
		const err = toApiError(e);
		if (err.code === 'NOT_ADMIN') return t('notAdmin');
		if (err.code === 'USER_BLOCKED') return t('blocked');
		if (err.isNetwork) return `${te('network')}. ${te('serverWakingHint')}`;
		return err.message || te('generic');
	};

	const requestCode = async (target: string) => {
		setPending(true);
		setError(null);
		try {
			const challenge = await http.post<OtpChallengeResponse>(
				'/auth/otp/request',
				{ phone: target },
				{ skipAuth: true },
			);
			setStep({ kind: 'code', phone: target, challenge, sentAt: Date.now() });
			setCode('');
			setTimeout(() => codeRef.current?.focus(), 0);
		} catch (e) {
			setError(describe(e));
		} finally {
			setPending(false);
		}
	};

	const verify = async (value: string) => {
		if (step.kind !== 'code') return;
		setPending(true);
		setError(null);
		try {
			const res = await fetch('/api/session', {
				method: 'POST',
				headers: { 'content-type': 'application/json', 'accept-language': localeStore.get() },
				body: JSON.stringify({ phone: step.phone, code: value }),
			});
			const body = await res.json().catch(() => ({}));
			if (!res.ok) throw problemToApiError(res.status, body);
			sessionStore.set(body as SessionPayload);
			router.replace(
				safeNextPath(sp.get('next'), window.location.origin, routes.overview, routes.login),
			);
		} catch (e) {
			setError(describe(e));
			setCode('');
			codeRef.current?.focus();
			setPending(false);
		}
	};

	if (step.kind === 'phone') {
		const normalized = `+${DIAL}${phone}`;
		const valid = phone.length === PHONE_LENGTH;
		return (
			<form
				className='space-y-6'
				onSubmit={e => {
					e.preventDefault();
					if (valid) void requestCode(normalized);
					else setError(t('invalidPhone'));
				}}
			>
				<Field label={t('phone')} htmlFor='phone' error={error ?? undefined}>
					<div className='flex items-center rounded-full border border-input bg-background focus-within:ring-2 focus-within:ring-ring'>
						<span className='pl-4 num text-muted-foreground select-none'>+{DIAL}</span>
						<Input
							id='phone'
							type='tel'
							inputMode='numeric'
							autoComplete='tel-national'
							autoFocus
							value={phone}
							onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, PHONE_LENGTH))}
							placeholder='90 123 45 67'
							className='border-0 bg-transparent pl-2 num shadow-none focus-visible:ring-0'
							aria-invalid={Boolean(error)}
						/>
					</div>
				</Field>
				<Button type='submit' className='h-14 w-full' disabled={pending}>
					{pending ? t('checking') : t('sendCode')}
				</Button>
			</form>
		);
	}

	return (
		<form
			className='space-y-6'
			onSubmit={e => {
				e.preventDefault();
				if (code.length === codeLength) void verify(code);
			}}
		>
			<p className='text-sm text-muted-foreground'>
				{t('codeSent', { phone: formatPhone(step.phone), length: codeLength })}
			</p>
			<Field label={t('code')} htmlFor='code' error={error ?? undefined}>
				<Input
					id='code'
					ref={codeRef}
					inputMode='numeric'
					autoComplete='one-time-code'
					maxLength={codeLength}
					value={code}
					onChange={e => {
						const v = e.target.value.replace(/\D/g, '').slice(0, codeLength);
						setCode(v);
						if (v.length === codeLength) void verify(v);
					}}
					className='h-14 text-center num text-2xl tracking-[0.5em]'
					placeholder={'•'.repeat(codeLength)}
					aria-invalid={Boolean(error)}
					disabled={pending}
				/>
			</Field>
			<Button
				type='submit'
				className='h-14 w-full'
				disabled={pending || code.length !== codeLength}
			>
				{pending ? t('checking') : t('verify')}
			</Button>
			<div className='flex items-center justify-between text-sm'>
				<Button
					type='button'
					variant='link'
					className='text-muted-foreground'
					onClick={() => {
						setStep({ kind: 'phone' });
						setError(null);
					}}
				>
					<ArrowLeftIcon /> {t('changePhone')}
				</Button>
				<Button
					type='button'
					variant='link'
					disabled={resendIn > 0 || pending}
					onClick={() => void requestCode(step.phone)}
				>
					{resendIn > 0 ? (
						<span className='num'>{t('resendIn', { seconds: resendIn })}</span>
					) : (
						t('resend')
					)}
				</Button>
			</div>
		</form>
	);
}
