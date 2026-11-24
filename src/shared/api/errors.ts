import { isAxiosError } from 'axios';

/** Normalised RFC 9457 problem+json error (`code`, `traceId` per backend docs). */
export class ApiError extends Error {
	status: number;
	code?: string;
	traceId?: string;
	fieldErrors: Record<string, string>;
	/** Network failure or timeout — typically a Render cold start. */
	isNetwork: boolean;

	constructor(init: {
		status: number;
		message: string;
		code?: string;
		traceId?: string;
		fieldErrors?: Record<string, string>;
		isNetwork?: boolean;
	}) {
		super(init.message);
		this.status = init.status;
		this.code = init.code;
		this.traceId = init.traceId;
		this.fieldErrors = init.fieldErrors ?? {};
		this.isNetwork = init.isNetwork ?? false;
	}
}

type Problem = {
	title?: string;
	detail?: string;
	message?: string;
	code?: string;
	traceId?: string;
	errors?: unknown;
	fieldErrors?: unknown;
	violations?: unknown;
};

function parseFieldErrors(p: Problem): Record<string, string> {
	const out: Record<string, string> = {};
	for (const src of [p.errors, p.fieldErrors, p.violations]) {
		if (!src) continue;
		if (Array.isArray(src)) {
			for (const e of src) {
				if (e && typeof e === 'object') {
					const o = e as Record<string, unknown>;
					const field = (o.field ?? o.property ?? o.name ?? o.pointer) as string | undefined;
					const msg = (o.message ?? o.detail ?? o.defaultMessage) as string | undefined;
					if (field && msg) out[String(field).replace(/^\//, '')] = String(msg);
				}
			}
		} else if (typeof src === 'object') {
			for (const [k, v] of Object.entries(src as Record<string, unknown>)) {
				out[k] = Array.isArray(v) ? String(v[0]) : String(v);
			}
		}
	}
	return out;
}

export function problemToApiError(status: number, body: unknown): ApiError {
	const p = (body && typeof body === 'object' ? body : {}) as Problem;
	return new ApiError({
		status,
		code: p.code,
		traceId: p.traceId,
		message:
			p.detail || p.message || p.title || (typeof body === 'string' && body) || `HTTP ${status}`,
		fieldErrors: parseFieldErrors(p),
	});
}

export function toApiError(e: unknown): ApiError {
	if (e instanceof ApiError) return e;
	if (isAxiosError(e)) {
		if (!e.response) {
			return new ApiError({
				status: 0,
				message: e.message || 'Network error',
				code: e.code,
				isNetwork: true,
			});
		}
		const err = problemToApiError(e.response.status, e.response.data);
		// Render returns 502/503/504 from its edge while the instance boots.
		if ([502, 503, 504].includes(e.response.status)) err.isNetwork = true;
		return err;
	}
	if (e instanceof Error) return new ApiError({ status: 0, message: e.message });
	return new ApiError({ status: 0, message: String(e) });
}

export function isRetryable(e: unknown) {
	return toApiError(e).isNetwork;
}
