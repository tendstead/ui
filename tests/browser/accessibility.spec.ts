import { test, expect } from '../fixtures/test';
import AxeBuilder from '@axe-core/playwright';
for(const app of ['receipts','downloader']) for(const theme of ['light','dark']) {
  test(`${app} ${theme} accessibility closed and modal`,async({page})=>{
    await page.setViewportSize({width:360,height:740});
    await page.goto(`/?app=${app}&theme=${theme}&long=1&services=1&account=1`);
    expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
    await page.getByRole('button',{name:'Menu',exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();
    expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
  });
}
