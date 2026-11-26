import { expect, test } from '@playwright/test';
import { problem } from './mock-api';

test('without a session the dashboard redirects to login and keeps the target', async ({
	page,
}) => {
	await page.goto('/users?status=BLOCKED');
	await expect(page).toHaveURL('/login?next=%2Fusers%3Fstatus%3DBLOCKED');
});

test('a non-admin phone is refused at login', async ({ page }) => {
	await page.route('**/api/v1/auth/otp/request', route =>
		route.fulfill({ json: { codeLength: 6, resendAfterSeconds: 60 } }),
	);
	await page.route('**/api/session', route => problem(route, 403, 'NOT_ADMIN'));

	await page.goto('/login');
	await page.getByLabel('Telefon raqam').fill('901234567');
	await page.getByRole('button', { name: 'Kod olish' }).click();
	await page.getByLabel('Tasdiqlash kodi').fill('123456');

	await expect(page.getByText("Ruxsat yo'q: bu raqam administrator emas.")).toBeVisible();
	await expect(page).toHaveURL(/\/login/);
});
