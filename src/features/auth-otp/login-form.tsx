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
import { Button } from '@/shared/ui/kit/button';
import { Input } from '@/shared/ui/kit/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/shared/ui/kit/select';
import { Field } from '@/shared/ui/field';

const COUNTRIES = [
	{ id: 'uz', dial: '998', length: 9, placeholder: '90 123 45 67' },
	{ id: 'kz', dial: '7', length: 10, placeholder: '701 123 45 67' },
	{ id: 'kg', dial: '996', length: 9, placeholder: '700 123 456' },
	{ id: 'tj', dial: '992', length: 9, placeholder: '917 123 456' },
	{ id: 'tm', dial: '993', length: 8, placeholder: '65 123456' },
] as const;

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

function safeNext(next: string | null) {
	if (!next) return routes.overview;
	try {
		const u = new URL(next, window.location.origin);
		const isLogin = u.pathname === routes.login || u.pathname.startsWith(`${routes.login}/`);
		if (u.origin !== window.location.origin || isLogin) {
			return routes.overview;
		}
		return u.pathname + u.search + u.hash;
	} catch {
		return routes.overview;
	}
}

export function LoginForm() {
	const t = useTranslations('auth');
	const te = useTranslations('errors');
	const router = useRouter();
	const sp = useSearchParams();

	const [step, setStep] = useState<Step>({ kind: 'phone' });
	const [countryId, setCountryId] = useState<(typeof COUNTRIES)[number]['id']>('uz');
	const [phone, setPhone] = useState('');
	const country = COUNTRIES.find(c => c.id === countryId) ?? COUNTRIES[0];
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
			router.replace(safeNext(sp.get('next')));
		} catch (e) {
			setError(describe(e));
			setCode('');
			codeRef.current?.focus();
			setPending(false);
		}
	};

	if (step.kind === 'phone') {
		const normalized = `+${country.dial}${phone}`;
		const valid = phone.length === country.length;
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
					<div className='flex gap-2'>
						<Select
							value={countryId}
							onValueChange={v => {
								setCountryId(v as typeof countryId);
								setPhone('');
								setError(null);
							}}
						>
							<SelectTrigger className='w-auto shrink-0' aria-label={t('phone')}>
								<SelectValue>
									<span className='num'>+{country.dial}</span>
								</SelectValue>
							</SelectTrigger>
							<SelectContent>
								{COUNTRIES.map(c => (
									<SelectItem key={c.id} value={c.id}>
										{t(`countries.${c.id}`)} <span className='num'>+{c.dial}</span>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Input
							id='phone'
							type='tel'
							inputMode='numeric'
							autoComplete='tel-national'
							autoFocus
							value={phone}
							onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, country.length))}
							placeholder={country.placeholder}
							className='num'
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
