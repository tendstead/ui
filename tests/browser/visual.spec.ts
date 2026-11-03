import { test, expect } from '../fixtures/test';
import { visuals } from '../fixtures/scenarios';
for(const fixture of visuals) test(fixture.name,async({page})=>{
  await page.setViewportSize({width:fixture.width,height:fixture.height});await page.goto(`/?${fixture.query}`);
  await expect(page.getByRole('heading',{level:1})).toBeVisible();await page.evaluate(()=>document.fonts.ready);
  if(fixture.end) await page.getByRole('button',{name:'End of page action',exact:true}).scrollIntoViewIfNeeded();
  if(fixture.drawer) {await page.getByRole('button',{name:'Menu',exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();}
  await page.mouse.move(0,0);
  await expect(page).toHaveScreenshot(`${fixture.name}.png`,{animations:'disabled'});
});
