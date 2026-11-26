import { expect, test } from '@playwright/test';
import { mockAdminSession, page as pageOf } from './mock-api';

const MASTER_ID = '00000000-0000-0000-0000-0000000000aa';

function master(status: string) {
	return {
		phone: '+998901112233',
		profile: { userId: MASTER_ID, fullName: 'Ali Valiyev', verificationStatus: status },
	};
}

test('list filters and pagination live in the URL', async ({ context, page }) => {
	await mockAdminSession(context, page);
	const requests: URLSearchParams[] = [];
	await page.route('**/api/v1/admin/masters?*', route => {
		const params = new URL(route.request().url()).searchParams;
		requests.push(params);
		return route.fulfill({
			json: pageOf([master(params.get('status') ?? 'PENDING')], {
				page: Number(params.get('page') ?? 0),
				totalPages: 3,
			}),
		});
	});

	await page.goto('/masters');
	await expect(page.getByRole('cell', { name: 'Ali Valiyev' })).toBeVisible();
	expect(requests.at(-1)?.get('status')).toBe('PENDING');

	await page.getByRole('tab', { name: 'Tasdiqlangan' }).click();
	await expect(page).toHaveURL('/masters?status=APPROVED');
	await expect.poll(() => requests.at(-1)?.get('status')).toBe('APPROVED');

	await page.getByRole('button', { name: 'Keyingi' }).click();
	await expect(page).toHaveURL('/masters?status=APPROVED&page=1');
	await expect.poll(() => requests.at(-1)?.get('page')).toBe('1');

	await page.reload();
	await expect(page.getByRole('tab', { name: 'Tasdiqlangan' })).toHaveAttribute(
		'aria-selected',
		'true',
	);
});

test('approving a master confirms, toasts and refetches the detail', async ({ context, page }) => {
	await mockAdminSession(context, page);
	let status = 'PENDING';
	let detailLoads = 0;
	await page.route(`**/api/v1/admin/masters/${MASTER_ID}`, route => {
		detailLoads++;
		return route.fulfill({ json: { ...master(status), documents: [] } });
	});
	await page.route(`**/api/v1/admin/masters/${MASTER_ID}/approve`, route => {
		status = 'APPROVED';
		return route.fulfill({ json: master(status).profile });
	});

	await page.goto(`/masters/${MASTER_ID}`);
	await page.getByRole('button', { name: 'Tasdiqlash' }).click();
	const dialog = page.getByRole('dialog');
	await expect(dialog).toContainText('Ali Valiyev');
	await dialog.getByRole('button', { name: 'Tasdiqlash' }).click();

	await expect(page.getByText('Usta tasdiqlandi')).toBeVisible();
	await expect(dialog).toBeHidden();
	await expect.poll(() => detailLoads).toBeGreaterThan(1);
	await expect(page.getByRole('button', { name: 'Tasdiqlash' })).toBeHidden();
});

test('list pages do not refetch in a loop', async ({ context, page }) => {
	await mockAdminSession(context, page);
	let masters = 0;
	let categories = 0;
	await page.route('**/api/v1/admin/masters?*', route => {
		// size=1 is the sidebar pending-count badge; count only the table query
		if (new URL(route.request().url()).searchParams.get('size') !== '1') masters++;
		return route.fulfill({ json: pageOf([master('PENDING')]) });
	});
	await page.route('**/api/v1/admin/catalog/categories', route => {
		categories++;
		return route.fulfill({
			json: [{ id: 'c1', slug: 'santexnika', name: { uz: 'Santexnika' }, status: 'ACTIVE' }],
		});
	});

	await page.goto('/masters');
	await expect(page.getByRole('cell', { name: 'Ali Valiyev' })).toBeVisible();
	await page.waitForTimeout(2_000);
	expect(masters).toBe(1);

	await page.goto('/catalog/categories');
	await expect(page.getByRole('button', { name: "O'chirish" })).toBeVisible();
	await page.waitForTimeout(2_000);
	expect(categories).toBe(1);
});

test('search commits once after the debounce and clears back', async ({ context, page }) => {
	await mockAdminSession(context, page);
	const phones: (string | null)[] = [];
	await page.route('**/api/v1/admin/users?*', route => {
		const params = new URL(route.request().url()).searchParams;
		if (params.get('size') !== '1') phones.push(params.get('phone'));
		return route.fulfill({ json: pageOf([]) });
	});

	await page.goto('/users');
	await expect.poll(() => phones.length).toBe(1);
	await page.getByRole('textbox').pressSequentially('90123', { delay: 50 });
	await expect(page).toHaveURL('/users?phone=90123');
	await expect.poll(() => phones.at(-1)).toBe('90123');
	expect(phones).toEqual([null, '90123']);

	await page.getByRole('textbox').fill('');
	await expect(page).toHaveURL('/users');
});

test('a filter changed while the search is debouncing is kept', async ({ context, page }) => {
	await mockAdminSession(context, page);
	await page.route('**/api/v1/admin/users?*', route => route.fulfill({ json: pageOf([]) }));

	await page.goto('/users');
	await page.getByRole('textbox').fill('901');
	await page.getByRole('combobox').filter({ hasText: 'Barcha statuslar' }).click();
	await page.getByRole('option', { name: 'Bloklangan' }).click();

	await expect(page).toHaveURL(/phone=901/);
	await expect(page).toHaveURL(/status=BLOCKED/);
});
