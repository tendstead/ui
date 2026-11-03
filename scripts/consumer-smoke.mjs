import { mkdtemp,writeFile,readFile,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join,resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
const root=process.cwd();const fixture=await mkdtemp(join(tmpdir(),'tendstead-ui-consumer-'));
function run(args,cwd=fixture) {
  const result=spawnSync('npm',args,{cwd,encoding:'utf8',env:{...process.env,npm_config_cache:process.env.npm_config_cache??'/tmp/tendstead-ui-npm-cache'}});
  if(result.status!==0)throw Error(`npm ${args.join(' ')} failed\n${result.stdout}\n${result.stderr}`);
  return result.stdout;
}
try {
  const packed=JSON.parse(run(['pack','--json','--pack-destination',fixture],root))[0];
  assert(packed.files.some(f=>f.path==='dist/theme.css'));
  assert(packed.files.some(f=>f.path==='dist/AppShell.svelte'));
  const source=JSON.parse(await readFile(resolve('package.json'),'utf8'));
  await writeFile(join(fixture,'package.json'),JSON.stringify({private:true,type:'module',dependencies:{'@tendstead/ui':`file:${join(fixture,packed.filename)}`,svelte:source.devDependencies.svelte,vite:source.devDependencies.vite,'@sveltejs/vite-plugin-svelte':source.devDependencies['@sveltejs/vite-plugin-svelte']}}));
  run(['install','--ignore-scripts','--no-audit','--no-fund','--prefer-offline']);
  await writeFile(join(fixture,'index.html'),'<div id="app"></div><script type="module" src="/main.js"></script>');
  await writeFile(join(fixture,'main.js'),"import {mount} from 'svelte';import App from './Consumer.svelte';import '@tendstead/ui/theme.css';mount(App,{target:document.getElementById('app')});");
  await writeFile(join(fixture,'Consumer.svelte'),'<script>import {AppShell} from "@tendstead/ui";</script><AppShell brand="Consumer" appLabel="Smoke" pageTitle="Packed consumer" pathname="/" destinations={[{id:"home",label:"Home",href:"/"}]} mobilePrimaryIds={["home"]}><p>Independent packed content</p></AppShell>');
  await writeFile(join(fixture,'svelte.config.js'),'export default {};');
  await writeFile(join(fixture,'vite.config.js'),"import {defineConfig} from 'vite';import {svelte} from '@sveltejs/vite-plugin-svelte';export default defineConfig({plugins:[svelte()]});");
  run(['exec','vite','--','build']);
  await writeFile(join(fixture,'ssr.mjs'),`import {createServer} from 'vite';import assert from 'node:assert/strict';const server=await createServer({server:{middlewareMode:true,watch:null},appType:'custom'});try{const {default:Consumer}=await server.ssrLoadModule('/Consumer.svelte');const {render}=await server.ssrLoadModule('svelte/server');const output=render(Consumer);assert.match(output.body,/Independent packed content/);assert.match(output.body,/Packed consumer/);console.log('Packed SSR rendered without browser globals');}finally{await server.close();}`);
  const ssr=spawnSync(process.execPath,['ssr.mjs'],{cwd:fixture,encoding:'utf8'});
  if(ssr.status!==0)throw Error(ssr.stdout+ssr.stderr);
  console.log(ssr.stdout.trim());console.log('Independent npm pack consumer build passed');
}finally{await rm(fixture,{recursive:true,force:true});}
