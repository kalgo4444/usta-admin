import { describe, expect, it } from 'vitest';
import { apiUrlProblem } from './instrumentation.node';

describe('apiUrlProblem', () => {
	it.each(['https://api.example.com', 'http://127.0.0.1:9', 'https://api.example.com/'])(
		'accepts %s',
		url => expect(apiUrlProblem(url)).toBeNull(),
	);

	it.each([
		undefined,
		'',
		'api.example.com',
		'localhost:8080',
		'ftp://api.example.com',
		'https://api.example.com/api/v1',
		'https://api.example.com?x=1',
		'https://user:pass@api.example.com',
	])('rejects %s', url => expect(apiUrlProblem(url)).not.toBeNull());
});
