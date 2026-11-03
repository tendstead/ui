import { test, expect } from '../fixtures/test';
import { viewports } from '../fixtures/scenarios';
// Catches lost bottom clearance, overflowing mobile labels, and undersized navigation.
for (const viewport of viewports) for (const app of ['receipts','downloader']) {
  test(`${app} geometry ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto(`/?app=${app}&long=1&services=1&account=1`);
    await expect(page.getByRole('heading',{level:1})).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const mobile=viewport.width<768;
    const nav=page.getByRole('navigation',{name:mobile?'Mobile navigation':'Main navigation',exact:true});
    await expect(nav).toBeVisible();
    for (const target of await nav.locator('a,button').all()) {
      const box=await target.boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(44);
      expect(box!.width).toBeGreaterThanOrEqual(44);
    }
    const overlaps=await nav.locator('.ts-badge').evaluateAll(badges=>badges.some(badge=>{
      const b=badge.getBoundingClientRect(); const l=badge.parentElement!.querySelector('.ts-nav-label')!.getBoundingClientRect();
      return b.left<l.right && b.right>l.left && b.top<l.bottom && b.bottom>l.top;
    }));
    expect(overlaps).toBe(false);
    const end=page.getByRole('button',{name:'End of page action',exact:true});
    await end.scrollIntoViewIfNeeded();
    if (mobile) {
      const b=await end.boundingBox(); const bar=await nav.boundingBox();
      expect(b!.y+b!.height).toBeLessThanOrEqual(bar!.y);
    }
    await end.click();
    await expect(page.getByRole('status')).toHaveText('End of page action received');
  });
}
test('theme leaves app content links under app control',async({page})=>{
  await page.goto('/');
  const styles=await page.evaluate(()=>{
    const anchor=document.createElement('a');anchor.href='#example';anchor.textContent='App link';
    const reference=anchor.cloneNode(true) as HTMLAnchorElement;
    document.querySelector('main')!.append(anchor); document.body.append(reference);
    const pick=(el:Element)=>({color:getComputedStyle(el).color,decoration:getComputedStyle(el).textDecorationLine});
    return {actual:pick(anchor),reference:pick(reference)};
  });
  expect(styles.actual).toEqual(styles.reference);
});

// Catches a sidebar stretched to document height or moving out of view with content.
for (const viewport of [{width:1280,height:800},{width:873,height:393}]) {
  test(`desktop sidebar stays reachable while document scrolls ${viewport.width}x${viewport.height}`,async({page})=>{
    await page.setViewportSize(viewport);
    await page.goto('/?long=1&services=1&account=1&admin=1');
    const sidebar=page.locator('.ts-sidebar');
    await page.getByRole('button',{name:'End of page action',exact:true}).scrollIntoViewIfNeeded();
    const documentScroll=await page.evaluate(()=>window.scrollY);
    expect(documentScroll).toBeGreaterThan(0);
    const bounds=await sidebar.boundingBox();
    expect(bounds!.y).toBeGreaterThanOrEqual(0);
    expect(bounds!.y+bounds!.height).toBeLessThanOrEqual(viewport.height);
    expect(await sidebar.evaluate(el=>el.scrollHeight>el.clientHeight)).toBe(true);
    await sidebar.focus();
    await expect(sidebar).toBeFocused();
    await page.keyboard.press('End');
    await expect.poll(()=>sidebar.evaluate(el=>el.scrollTop)).toBeGreaterThan(0);
    const service=sidebar.getByRole('link',{name:'Shopping list'});
    // Observe a real click without leaving the local fixture for an external service.
    await service.evaluate(el=>el.addEventListener('click',event=>{event.preventDefault();el.setAttribute('data-clicked','true');},{once:true}));
    await service.scrollIntoViewIfNeeded();await service.click();
    await expect(service).toHaveAttribute('data-clicked','true');
    const account=sidebar.getByRole('button',{name:'Alex · local account'});
    await account.scrollIntoViewIfNeeded();await account.click();
    await expect(page.getByRole('status')).toHaveText('Demo account controls opened');
    expect(await page.evaluate(()=>window.scrollY)).toBe(documentScroll);
    const primary=sidebar.getByRole('link',{name:'Haushaltsübersicht und Zusammenfassung'});
    await primary.scrollIntoViewIfNeeded();await primary.click();
    await expect(page.getByRole('heading',{level:1})).toHaveText('Overview');
    const primaryBounds=await primary.boundingBox();
    expect(primaryBounds!.y).toBeGreaterThanOrEqual(0);
    expect(primaryBounds!.y+primaryBounds!.height).toBeLessThanOrEqual(viewport.height);
  });
}
