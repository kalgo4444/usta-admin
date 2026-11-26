import { expect, test } from '@playwright/test';
import { ADMIN, mockAdminSession, problem, SUPER_ADMIN } from './mock-api';

test('menu and routes follow the admin permissions', async ({ context, page }) => {
	await mockAdminSession(context, page, { ...ADMIN, permissions: ['ORDERS'] });

	await page.goto('/orders');
	const nav = page.locator('aside nav');
	await expect(nav.getByRole('link', { name: 'Buyurtmalar' })).toBeVisible();
	await expect(nav.getByRole('link', { name: 'Ustalar' })).toHaveCount(0);
	await expect(nav.getByRole('link', { name: 'Adminlar' })).toHaveCount(0);

	await page.goto('/masters');
	await expect(page.getByText("Ruxsat yo'q")).toBeVisible();
});

test('a super admin appoints an admin with permissions', async ({ context, page }) => {
	await mockAdminSession(context, page, SUPER_ADMIN);
	let body: unknown;
	await page.route('**/api/v1/admin/admins', route => {
		if (route.request().method() === 'POST') {
			body = route.request().postDataJSON();
			return route.fulfill({ status: 201, json: { id: 'a2', ...(body as object) } });
		}
		return route.fulfill({
			json: [{ id: 'a1', phone: '+998900000001', superAdmin: true, status: 'ACTIVE' }],
		});
	});

	await page.goto('/admins');
	await expect(page.getByRole('cell', { name: /Super admin/ })).toBeVisible();
	await page.getByRole('button', { name: 'Admin tayinlash' }).click();
	const dialog = page.getByRole('dialog');
	await dialog.getByLabel('Telefon').fill('90 123 45 67');
	await dialog.getByRole('button', { name: 'Buyurtmalar' }).click();
	await dialog.getByRole('button', { name: 'Admin tayinlash' }).click();

	await expect(page.getByText('Admin tayinlandi')).toBeVisible();
	expect(body).toEqual({ phone: '+998901234567', permissions: ['ORDERS'] });
});

test('deleting a non-empty category asks again and cascades', async ({ context, page }) => {
	await mockAdminSession(context, page);
	await page.route('**/api/v1/admin/catalog/categories', route =>
		route.fulfill({
			json: [{ id: 'c1', slug: 'santexnika', name: { uz: 'Santexnika' }, status: 'ACTIVE' }],
		}),
	);
	const deletes: string[] = [];
	await page.route('**/api/v1/admin/catalog/categories/c1*', route => {
		const url = new URL(route.request().url());
		deletes.push(url.search);
		return url.searchParams.get('cascade') === 'true'
			? route.fulfill({ status: 204 })
			: problem(route, 409, 'CATEGORY_NOT_EMPTY', 'Ichida 2 ta xizmat bor.');
	});

	await page.goto('/catalog/categories');
	await page.getByRole('button', { name: "O'chirish" }).click();
	const dialog = page.getByRole('dialog');
	await dialog.getByRole('button', { name: "O'chirish" }).click();

	await expect(dialog.getByText('Ichida 2 ta xizmat bor.')).toBeVisible();
	const confirm = dialog.getByRole('button', { name: "O'chirish" });
	await expect(confirm).toBeDisabled();
	await dialog.getByRole('textbox').fill('DELETE');
	await confirm.click();

	await expect(page.getByText("O'chirildi")).toBeVisible();
	expect(deletes).toEqual(['', '?cascade=true']);
});
