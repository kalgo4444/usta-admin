import { defineConfig, devices } from '@playwright/test';

const PORT = 4020;

/**
 * E2E against the production build (`npm run build` first) with the backend mocked in the
 * browser: every /api/session and /api/v1 call is intercepted by `e2e/mock-api.ts`, so
 * API_URL only has to satisfy the start-up check and is never reached.
 */
export default defineConfig({
	testDir: 'e2e',
	fullyParallel: true,
	forbidOnly: Boolean(process.env.CI),
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? 'github' : 'list',
	use: { baseURL: `http://127.0.0.1:${PORT}`, trace: 'on-first-retry' },
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
	webServer: {
		command: `next start -p ${PORT}`,
		url: `http://127.0.0.1:${PORT}/api/health`,
		reuseExistingServer: !process.env.CI,
		env: { API_URL: 'http://127.0.0.1:9' },
	},
});
