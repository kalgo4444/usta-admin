/**
 * Control and invisible formatting characters the backend rejects with 400 VALIDATION_FAILED
 * (U+202E, U+200B, …). Tab, LF and CR are kept for multi-line fields.
 */
// A string (not a regex literal) so the escapes stay readable after formatting.
const FORBIDDEN = new RegExp(
	'[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F-\\u009F\\u00AD\\u200B-\\u200F\\u202A-\\u202E\\u2060-\\u2064\\u2066-\\u206F\\uFEFF]',
	'g',
);

export const sanitizeText = (s: string) => s.replace(FORBIDDEN, '');

/** Sanitize every string in a JSON-like value (request bodies). */
export function sanitizeDeep<T>(v: T): T {
	if (typeof v === 'string') return sanitizeText(v) as T;
	if (Array.isArray(v)) return v.map(sanitizeDeep) as T;
	if (v && typeof v === 'object' && Object.getPrototypeOf(v) === Object.prototype) {
		return Object.fromEntries(
			Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, sanitizeDeep(x)]),
		) as T;
	}
	return v;
}
