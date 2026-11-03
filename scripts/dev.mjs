import { spawn } from 'node:child_process';
const run=(args)=>spawn('npm',args,{stdio:'inherit',shell:false});
const build=run(['run','build:package']);
build.on('exit',code=>{
  if(code) process.exit(code);
  const children=[run(['run','watch:package']),run(['exec','vite','--','--host','0.0.0.0'])];
  let stopping=false;
  const stop=()=>{if(stopping)return;stopping=true;for(const child of children)child.kill('SIGTERM');};
  for(const signal of ['SIGINT','SIGTERM'])process.on(signal,stop);
  for(const child of children)child.on('exit',code=>{stop();process.exitCode=code??1;});
});
