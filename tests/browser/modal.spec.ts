import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '../fixtures/test';

test('Escape dismisses the named modal, restores focus and updates the bound state', async ({ page }) => {
  await page.goto('/?modal=1');
  const trigger = page.getByRole('button', { name: 'Show details' });
  const modal = page.getByRole('dialog', { name: 'Sample details' });
  await expect(modal).toBeHidden();

  await trigger.focus();
  await trigger.press('Enter');
  await expect(modal).toBeVisible();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(modal.getByRole('button', { name: 'Close details' })).toBeFocused();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  await page.keyboard.press('Escape');
  await expect(modal).toBeHidden();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(trigger).toBeFocused();
  await trigger.press('Enter');
  await expect(modal).toBeVisible();
});

test('the close button and a consumer state change can both dismiss the modal', async ({ page }) => {
  await page.goto('/?modal=1');
  const trigger = page.getByRole('button', { name: 'Show details' });
  const modal = page.getByRole('dialog', { name: 'Sample details' });
  await trigger.focus();
  await trigger.press('Enter');
  await modal.getByRole('button', { name: 'Close details' }).click();
  await expect(modal).toBeHidden();
  await expect(trigger).toBeFocused();

  await trigger.press('Enter');
  await modal.getByRole('button', { name: 'Done' }).click();
  await expect(modal).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('a long modal fits a short viewport and scrolls to its last control', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 430 });
  await page.goto('/?modal=1&theme=dark');
  const trigger = page.getByRole('button', { name: 'Show details' });
  await trigger.click();
  const modal = page.getByRole('dialog', { name: 'Sample details' });
  await expect(modal).toBeVisible();
  await expect(modal).toHaveCSS('background-color', 'rgb(25, 23, 29)');

  const bounds = await modal.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThan(0);
  expect(bounds!.x + bounds!.width).toBeLessThan(360);
  expect(bounds!.y).toBeGreaterThan(0);
  expect(bounds!.y + bounds!.height).toBeLessThan(430);

  const done = modal.getByRole('button', { name: 'Done' });
  await expect(done).not.toBeInViewport();
  await done.scrollIntoViewIfNeeded();
  await expect(done).toBeInViewport();
  await done.click();
  await expect(modal).toBeHidden();
  await expect(trigger).toBeFocused();
});
