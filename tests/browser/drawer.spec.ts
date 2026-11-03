import { test, expect } from '../fixtures/test';
test('drawer exposes all permitted destinations and route activation closes it',async({page})=>{
  await page.setViewportSize({width:360,height:740});await page.goto('/?services=1&account=1');
  await page.getByRole('button',{name:'Menu',exact:true}).click();
  const drawer=page.getByRole('dialog');
  expect(await drawer.getByRole('link').evaluateAll(links=>links.map(link=>link.getAttribute('href')).sort())).toEqual(['/', '/collections', '/receipts', '/receipts/review', '/search', '/settings', '/statistics', 'https://shopping.example.test/']);
  await expect(drawer.getByRole('link',{name:'Private admin'})).toHaveCount(0);
  await drawer.getByRole('link',{name:'Review queue 0'}).click();
  await expect(drawer).toBeHidden();
  await expect(page.getByRole('heading',{level:1})).toHaveText('Review queue');
  await expect(page.getByRole('button',{name:'Menu',exact:true})).toBeFocused();
});
test('unmounting an open drawer releases focus, inert and scroll locks',async({page})=>{
  await page.setViewportSize({width:393,height:873});await page.goto('/');
  await page.getByRole('button',{name:'Menu',exact:true}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  // The app may remove a shell while a modal is open (e.g. route/layout teardown).
  await page.getByRole('button',{name:'Unmount shell',includeHidden:true}).evaluate((el:HTMLButtonElement)=>el.click());
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const mount=page.getByRole('button',{name:'Mount shell'});await mount.click();
  expect(await page.locator('body').evaluate(el=>getComputedStyle(el).overflow)).not.toBe('hidden');
  expect(await page.locator('[data-shell-background]').evaluate((el:HTMLElement)=>el.inert)).toBe(false);
  await page.getByRole('button',{name:'Menu',exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();
});
test('nested routes, segment boundaries, modifiers and history preserve app routing',async({page})=>{
  await page.goto('/?route=/receipts-old');
  const nav=page.getByRole('navigation',{name:'Main navigation',exact:true});
  await expect(nav.locator('[aria-current]')).toHaveCount(0);
  await nav.getByRole('link',{name:'Receipts 0'}).click();
  await expect(nav.getByRole('link',{name:'Receipts 0'})).toHaveAttribute('aria-current','page');
  await nav.getByRole('link',{name:'Review queue 0'}).click();
  await expect(nav.getByRole('link',{name:'Review queue 0'})).toHaveAttribute('aria-current','page');
  await page.goBack();await expect(page.getByRole('heading',{level:1})).toHaveText('Receipts');
  // Prevent only the browser default in this observation; shell callbacks must not consume modifiers.
  const consumed=await nav.getByRole('link',{name:'Search'}).evaluate(el=>{
    let consumed=false;el.addEventListener('click',e=>{consumed=e.defaultPrevented;e.preventDefault();},{once:true});
    el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,ctrlKey:true}));return consumed;
  });
  expect(consumed).toBe(false);await expect(page.getByRole('heading',{level:1})).toHaveText('Receipts');
});
test('keyboard skip link reaches content and breakpoint transition closes drawer',async({page})=>{
  await page.setViewportSize({width:767,height:800});await page.goto('/');
  await page.keyboard.press('Tab');await expect(page.getByRole('link',{name:'Skip to content'})).toBeFocused();
  await page.keyboard.press('Enter');await expect(page.getByRole('main')).toBeFocused();
  await page.getByRole('button',{name:'Menu',exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();
  await page.setViewportSize({width:768,height:800});await expect(page.getByRole('dialog')).toBeHidden();
  expect(await page.locator('body').evaluate(el=>getComputedStyle(el).overflow)).not.toBe('hidden');
});
test('short mobile drawer scrolls every destination and account into reach',async({page})=>{
  await page.setViewportSize({width:393,height:430});await page.goto('/?long=1&services=1&account=1');
  await page.getByRole('button',{name:'Menu',exact:true}).click();
  const drawer=page.getByRole('dialog');
  for(const link of await drawer.getByRole('link').all()){
    await link.scrollIntoViewIfNeeded();const box=await link.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.y).toBeGreaterThanOrEqual(0);expect(box!.y+box!.height).toBeLessThanOrEqual(430);
  }
  const account=drawer.getByRole('button',{name:'Alex · local account'});
  await account.scrollIntoViewIfNeeded();await account.click();
  await expect(page.getByRole('status')).toHaveText('Demo account controls opened');
  expect(await drawer.evaluate(el=>el.scrollHeight>el.clientHeight)).toBe(true);
  await drawer.getByRole('link',{name:'Einstellungen und Haushaltsverwaltung'}).click();
  await expect(drawer).toBeHidden();await expect(page.getByRole('heading',{level:1})).toHaveText('Settings');
});
test('receipt fixture exposes Explore, zero queue and optional Administration',async({page})=>{
  await page.setViewportSize({width:393,height:430});await page.goto('/?admin=1&services=1');
  await page.getByRole('button',{name:'Menu',exact:true}).click();
  const drawer=page.getByRole('dialog');
  await expect(drawer.getByRole('link',{name:'Collections'})).toBeVisible();
  await expect(drawer.getByRole('link',{name:'Statistics'})).toBeVisible();
  await expect(drawer.getByRole('link',{name:'Review queue 0'})).toBeVisible();
  const admin=drawer.getByRole('link',{name:'Administration'});await admin.scrollIntoViewIfNeeded();await admin.click();
  await expect(page.getByRole('heading',{level:1})).toHaveText('Administration');
  await page.goto('/');await page.getByRole('button',{name:'Menu',exact:true}).click();
  await expect(page.getByRole('dialog').getByRole('link',{name:'Administration'})).toHaveCount(0);
});
test('open drawer retains focus through reactive permission and account removal',async({page})=>{
  await page.setViewportSize({width:393,height:873});await page.goto('/?controls=1&account=1');
  await page.getByRole('button',{name:'Menu',exact:true}).click();
  const drawer=page.getByRole('dialog');
  await drawer.getByRole('link',{name:'Review queue 0'}).focus();
  await page.getByRole('checkbox',{name:'Allow receipt access',includeHidden:true}).evaluate((el:HTMLInputElement)=>{el.checked=false;el.dispatchEvent(new Event('change',{bubbles:true}));});
  await expect(drawer.getByRole('link',{name:'Review queue 0'})).toHaveCount(0);
  await expect.poll(()=>drawer.evaluate(el=>el.contains(document.activeElement))).toBe(true);
  await drawer.getByRole('button',{name:'Alex · local account'}).focus();
  await page.getByRole('checkbox',{name:'Show account controls',includeHidden:true}).evaluate((el:HTMLInputElement)=>{el.checked=false;el.dispatchEvent(new Event('change',{bubbles:true}));});
  await expect(drawer.getByRole('button',{name:'Alex · local account'})).toHaveCount(0);
  await expect.poll(()=>drawer.evaluate(el=>el.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');await expect(drawer).toBeHidden();
  await expect(page.getByRole('button',{name:'Menu',exact:true})).toBeFocused();
  expect(await page.locator('[data-shell-background]').evaluate((el:HTMLElement)=>el.inert)).toBe(false);
  expect(await page.locator('body').evaluate(el=>getComputedStyle(el).overflow)).not.toBe('hidden');
});
