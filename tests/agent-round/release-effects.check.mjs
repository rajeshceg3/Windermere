import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';

// Execute the real source with every effect replaced, never spawn the runner.
// No network, git command, filesystem write, credential or child process is used.
const source=readFileSync(new URL('../../scripts/agent-round.mjs',import.meta.url),'utf8')
  .replace(/^#!.*\n/,'').replace(/^import .*;\n/gm,'');
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
async function scenario(options={}) {
  const commands=[],requests=[],writes=[];let builds=0;
  const exit={};
  const pkg=JSON.stringify({dependencies:{demo:'^1.0.0'}});
  const execSync=(cmd)=>{
    commands.push(cmd);
    if((options.installFail&&cmd==='pnpm install --frozen-lockfile')||
       (cmd==='pnpm --filter web build'&& (++builds===1?options.buildFail:options.rebuildFail))||
       (options.reinstallFail&&cmd==='pnpm install --no-frozen-lockfile')) {
      const e=new Error('mock command failure');e.stdout='error: fixture failure';throw e;
    }
    return '';
  };
  const fetch=async(url,opts={})=>{
    requests.push({url,method:opts.method||'GET',body:opts.body});
    if(url.startsWith('https://registry.npmjs.org/')) {
      if(options.registryFail)throw new Error('fixture unavailable');
      return {ok:true,json:async()=>({version:options.bump?'1.0.1':'1.0.0'})};
    }
    let body={};let status=200;
    if(url.includes('/search/issues?'))body={items:[{number:44}]};
    if(url.includes('Build%20broken')||url.includes('Build%2520broken'))body={items:options.existingFailure?[{number:55}]:[]};
    if(url.endsWith('/issues')&&opts.method==='POST'){body={number:55};status=201}
    if(url.endsWith('/comments'))status=options.commentFail?503:201;
    if(url.endsWith('/pulls')){body={html_url:'https://example.invalid/mock-pr'};status=201}
    return {status,text:async()=>JSON.stringify(body)};
  };
  const process={env:{GITHUB_REPOSITORY:'fixture/repo',...(options.noToken?{}:{GH_TOKEN:'fixture-only'})},exit:()=>{throw exit}};
  try {await new AsyncFunction('execSync','readFileSync','writeFileSync','existsSync','fetch','process','console',source)(
    execSync,p=>p==='apps/web/package.json'?pkg:'# seed',
    (p,v)=>writes.push({p,v}),()=>!options.noPackage,fetch,process,{log:()=>{}});
  } catch(e){if(e!==exit)throw e}
  return {commands,requests,writes};
}
const publishing=c=>c.commands.filter(x=>/^git (add|commit|push)/.test(x));
const pulls=c=>c.requests.filter(x=>x.url.endsWith('/pulls')&&x.method==='POST');
for(const [name,options] of Object.entries({
 'missing-token':{noToken:true},'install-failed':{installFail:true},
 'build-failed-new-issue':{buildFail:true},'build-failed-existing-issue':{buildFail:true,existingFailure:true},
 'build-failed-comment-unavailable':{buildFail:true,commentFail:true},
 'no-package':{noPackage:true},'healthy-no-change':{},'registry-unavailable':{registryFail:true},
 'bump-reinstall-failed':{bump:true,reinstallFail:true},'bump-build-failed':{bump:true,rebuildFail:true}
}))test(name+' does not publish source or a draft PR',async()=>{
 const r=await scenario(options);assert.deepEqual(publishing(r),[]);assert.deepEqual(pulls(r),[]);
 if(options.noToken){assert.equal(r.commands.length,0);assert.equal(r.requests.length,0)}
 if(options.buildFail||options.installFail){
   assert(!r.commands.some(x=>x.startsWith('git checkout -b')));
   assert(r.requests.some(x=>x.url.endsWith('/comments')));
   const filed=r.requests.filter(x=>x.url.endsWith('/issues')&&x.method==='POST');
   assert.equal(filed.length,options.existingFailure?0:1);
 }
 if(options.rebuildFail||options.reinstallFail)assert(r.commands.includes('git checkout -- .'));
});
test('green runtime dependency candidate retains one reviewed draft PR path',async()=>{
 const r=await scenario({bump:true});
 assert.equal(r.commands.filter(x=>x.startsWith('git push')).length,1);
 assert.equal(pulls(r).length,1);assert.equal(JSON.parse(pulls(r)[0].body).draft,true);
 assert(r.writes.some(x=>x.p==='apps/web/package.json'&&x.v.includes('1.0.1')));
 assert.equal(r.commands.filter(x=>x==='pnpm --filter web build').length,2);
});
