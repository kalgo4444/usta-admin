import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios';
import { describe, expect, it } from 'vitest';
import { ApiError, isRetryable, problemToApiError, toApiError } from './errors';

function axiosResponseError(status: number, data: unknown) {
	const response = { status, data, headers: {}, config: { headers: new AxiosHeaders() } };
	return new AxiosError(
		'fail',
		'ERR_BAD_RESPONSE',
		undefined,
		undefined,
		response as AxiosResponse,
	);
}

describe('problemToApiError', () => {
	it('reads RFC 9457 fields', () => {
		const e = problemToApiError(409, {
			detail: 'Already approved',
			code: 'CONFLICT',
			traceId: 't1',
		});
		expect(e).toMatchObject({
			status: 409,
			message: 'Already approved',
			code: 'CONFLICT',
			traceId: 't1',
		});
	});

	it('parses field errors from arrays and objects', () => {
		const fromArray = problemToApiError(400, {
			errors: [
				{ field: 'name', message: 'required' },
				{ pointer: '/price', detail: 'too big' },
			],
		});
		expect(fromArray.fieldErrors).toEqual({ name: 'required', price: 'too big' });

		const fromObject = problemToApiError(400, { fieldErrors: { phone: ['invalid', 'other'] } });
		expect(fromObject.fieldErrors).toEqual({ phone: 'invalid' });
	});

	it('falls back to a plain-text body, then to the status', () => {
		expect(problemToApiError(500, 'boom').message).toBe('boom');
		expect(problemToApiError(500, null).message).toBe('HTTP 500');
	});
});

describe('toApiError', () => {
	it('marks a request without a response as a network error', () => {
		const e = toApiError(new AxiosError('Network Error', 'ERR_NETWORK'));
		expect(e).toMatchObject({ status: 0, isNetwork: true, code: 'ERR_NETWORK' });
		expect(isRetryable(e)).toBe(true);
	});

	it('treats 502-504 (Render cold start) as retryable, other statuses not', () => {
		expect(isRetryable(axiosResponseError(503, {}))).toBe(true);
		expect(isRetryable(axiosResponseError(500, {}))).toBe(false);
		expect(isRetryable(axiosResponseError(409, { detail: 'x' }))).toBe(false);
	});

	it('returns an ApiError unchanged and wraps other values', () => {
		const original = new ApiError({ status: 404, message: 'nope' });
		expect(toApiError(original)).toBe(original);
		expect(toApiError('weird')).toMatchObject({ status: 0, message: 'weird' });
	});
});
