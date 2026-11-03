import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir:'tests/browser', fullyParallel:true, timeout:30000, workers:process.env.CI?4:undefined,
  updateSnapshots:'none', snapshotPathTemplate:'{testDir}/../screenshots/{arg}{ext}',
  reporter:[['list'],['html',{open:'never'}]],
  use:{ baseURL:'http://127.0.0.1:4173', trace:'retain-on-failure', screenshot:'only-on-failure', reducedMotion:'reduce',locale:'en-US',timezoneId:'Europe/Berlin' },
  webServer:{ command:'npm run build && npm run preview -- --port 4173', url:'http://127.0.0.1:4173', reuseExistingServer:!process.env.CI },
  projects:[
    ...['chromium','firefox','webkit'].map(name=>({name,testIgnore:/visual\.spec\.ts/,use:{...devices[name==='chromium'?'Desktop Chrome':name==='firefox'?'Desktop Firefox':'Desktop Safari']}})),
    {name:'visual',testMatch:/visual\.spec\.ts/,use:{...devices['Desktop Chrome']}},
  ],
});
