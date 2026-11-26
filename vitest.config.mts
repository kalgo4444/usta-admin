import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
	test: {
		include: ['src/**/*.test.ts'],
		environment: 'node',
		env: { API_URL: 'http://backend.test' },
		restoreMocks: true,
		unstubGlobals: true,
	},
});
