import dayjs from 'dayjs';

const NBSP = ' ';

/** 1250000 → "1 250 000 UZS" (space-grouped, decimals only when present). */
export function formatMoney(value: number | null | undefined, currency = 'UZS') {
	if (value === null || value === undefined || Number.isNaN(value)) return '—';
	const negative = value < 0;
	const abs = Math.abs(value);
	const [int, frac] = (Number.isInteger(abs) ? String(abs) : abs.toFixed(2)).split('.');
	const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
	const num = frac && frac !== '00' ? `${grouped},${frac}` : grouped;
	return `${negative ? '−' : ''}${num}${currency ? NBSP + currency : ''}`;
}

/** +998901234567 → "+998 90 123 45 67". Anything else is returned unchanged. */
export function formatPhone(phone: string | null | undefined) {
	if (!phone) return '—';
	const d = phone.replace(/\D/g, '');
	if (d.length === 12 && d.startsWith('998')) {
		return `+998 ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8, 10)} ${d.slice(10, 12)}`;
	}
	return phone;
}

/** Normalise user input to E.164 for Uzbekistan: "90 123 45 67" → "+998901234567". */
export function normalizePhone(input: string) {
	const d = input.replace(/\D/g, '');
	if (d.length === 9) return `+998${d}`;
	if (d.startsWith('998')) return `+${d}`;
	return input.startsWith('+') ? `+${d}` : `+${d}`;
}

export function formatDate(iso: string | null | undefined, withTime = true) {
	if (!iso) return '—';
	const d = dayjs(iso);
	if (!d.isValid()) return iso;
	return d.format(withTime ? 'DD.MM.YYYY HH:mm' : 'DD.MM.YYYY');
}

export function formatPercent(v: number | null | undefined) {
	if (v === null || v === undefined) return '—';
	return `${Number(v.toFixed(2))}%`;
}

export function shortId(id: string | null | undefined) {
	return id ? id.slice(0, 8) : '—';
}

export function formatBytes(n: number | null | undefined) {
	if (!n) return '—';
	if (n < 1024) return `${n} B`;
	if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
	return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

/** Monday (ISO week start) of the week containing `d`, as YYYY-MM-DD. */
export function weekStart(d: dayjs.ConfigType = undefined) {
	const x = dayjs(d);
	const diff = (x.day() + 6) % 7;
	return x.subtract(diff, 'day').format('YYYY-MM-DD');
}
